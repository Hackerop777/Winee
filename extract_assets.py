import os
import sys
import struct
import plistlib
import zlib

def extract_dmg(dmg_path, output_dir):
    print(f"Opening DMG: {dmg_path}")
    os.makedirs(output_dir, exist_ok=True)
    
    with open(dmg_path, 'rb') as f:
        f.seek(-512, 2)
        koly = f.read(512)
        magic = koly[:4]
        if magic != b'koly':
            raise ValueError(f"Invalid DMG trailer magic: {magic}")
            
        xml_offset, xml_length = struct.unpack('>QQ', koly[216:232])
        f.seek(xml_offset)
        plist_data = f.read(xml_length)
        pl = plistlib.loads(plist_data)
        
        # Find Apple_HFS partition
        hfs_blkx = None
        for b in pl['resource-fork']['blkx']:
            if 'Apple_HFS' in b.get('Name', ''):
                hfs_blkx = b
                break
                
        if not hfs_blkx:
            raise ValueError("Apple_HFS partition not found in DMG")
            
        data = hfs_blkx['Data']
        chunk_count = struct.unpack('>I', data[200:204])[0]
        print(f"Decompressing {chunk_count} HFS+ chunks...")
        
        uncompressed = bytearray()
        for i in range(chunk_count):
            c = data[204 + i*40 : 204 + (i+1)*40]
            ctype, comm, snum, scnt, coff, clen = struct.unpack('>IIQQQQ', c)
            if ctype == 0x80000005: # zlib compressed
                f.seek(coff)
                uncompressed.extend(zlib.decompress(f.read(clen)))
            elif ctype == 0x1: # raw
                f.seek(coff)
                uncompressed.extend(f.read(clen))
            elif ctype == 0x2: # zero fill
                uncompressed.extend(b'\x00' * (scnt * 512))
                
        print(f"Decompressed HFS+ image size: {len(uncompressed)} bytes ({len(uncompressed)/(1024*1024):.1f} MB)")
        
        # Parse HFS+ Volume Header at offset 1024
        vh = uncompressed[1024:1024+512]
        sig = vh[:2]
        if sig != b'H+':
            raise ValueError(f"Unexpected HFS signature: {sig}")
            
        block_size = struct.unpack('>I', vh[40:44])[0]
        cat_fork = vh[272:272+80]
        cat_logical_size, cat_clump, cat_total_blocks = struct.unpack('>QII', cat_fork[:16])
        sb, bc = struct.unpack('>II', cat_fork[16:24])
        print(f"Catalog B-tree at block {sb}, blocks: {bc}, size: {cat_logical_size}")
        
        cat_data = uncompressed[sb*block_size : (sb+bc)*block_size]
        treeDepth, rootNode, totalNodes, firstLeafNode, lastLeafNode, nodeSize = struct.unpack('>HIIIIH', cat_data[14:34])
        print(f"BTree: depth={treeDepth}, firstLeaf={firstLeafNode}, nodeSize={nodeSize}")
        
        # Traverse Catalog B-tree leaf nodes
        curr_node = firstLeafNode
        visited = set()
        extracted_files = []
        
        # Keep track of folder hierarchy: folder_id -> folder_name
        folders = {1: "", 2: ""}
        folder_parents = {}
        file_entries = []
        
        while curr_node != 0 and curr_node not in visited and curr_node < totalNodes:
            visited.add(curr_node)
            node_offset = curr_node * nodeSize
            node_bytes = cat_data[node_offset : node_offset + nodeSize]
            flink, blink, kind, height, num_records = struct.unpack('>IIBBH', node_bytes[:12])
            
            record_offsets = [struct.unpack('>H', node_bytes[nodeSize - 2*(i+1) : nodeSize - 2*i])[0] for i in range(num_records)]
            for roff in record_offsets:
                key_len = struct.unpack('>H', node_bytes[roff:roff+2])[0]
                if key_len == 0:
                    continue
                parent_id = struct.unpack('>I', node_bytes[roff+2:roff+6])[0]
                str_len = struct.unpack('>H', node_bytes[roff+6:roff+8])[0]
                name = node_bytes[roff+8 : roff+8 + str_len*2].decode('utf-16-be', errors='ignore')
                rec_off = roff + 2 + key_len
                rec_type = struct.unpack('>H', node_bytes[rec_off:rec_off+2])[0]
                
                if rec_type == 1: # Folder record
                    folder_id = struct.unpack('>I', node_bytes[rec_off+8:rec_off+12])[0]
                    folders[folder_id] = name
                    folder_parents[folder_id] = parent_id
                elif rec_type == 2: # File record
                    file_id = struct.unpack('>I', node_bytes[rec_off+8:rec_off+12])[0]
                    # HFSPlusCatalogFile layout:
                    # 0..88: metadata (type, flags, dates, permissions, finder info)
                    # 88..168: dataFork (80 bytes: 8 bytes size, 4 clump, 4 blocks, 64 extents)
                    fork_data = node_bytes[rec_off+88 : rec_off+88+80]
                    data_logical_size = struct.unpack('>Q', fork_data[:8])[0]
                    extents = []
                    for e in range(8):
                        e_sb, e_bc = struct.unpack('>II', fork_data[16 + e*8 : 16 + (e+1)*8])
                        if e_bc > 0:
                            extents.append((e_sb, e_bc))
                    file_entries.append((parent_id, file_id, name, data_logical_size, extents))
            curr_node = flink
            
        print(f"Catalog scan found {len(file_entries)} files across {len(folders)} folders.")
        
        # Build full folder paths
        def get_full_folder(fid):
            path_parts = []
            curr = fid
            while curr in folders and folders[curr]:
                path_parts.append(folders[curr])
                curr = folder_parents.get(curr, 0)
            return "/".join(reversed(path_parts))

        # Extract files of interest
        for parent_id, file_id, name, size, extents in file_entries:
            lower = name.lower()
            if any(lower.endswith(ext) for ext in ['.wav', '.png', '.svg', '.car', '.plist', '.icns', '.json']):
                file_buf = bytearray()
                bytes_left = size
                for e_sb, e_bc in extents:
                    chunk_bytes = min(bytes_left, e_bc * block_size)
                    start_off = e_sb * block_size
                    file_buf.extend(uncompressed[start_off : start_off + chunk_bytes])
                    bytes_left -= chunk_bytes
                    if bytes_left <= 0:
                        break
                
                folder_path = get_full_folder(parent_id)
                safe_prefix = folder_path.replace(" ", "_").replace("/", "_")
                dest_name = f"{safe_prefix}_{name}" if safe_prefix not in ("root", "") else name
                out_path = os.path.join(output_dir, dest_name)
                with open(out_path, 'wb') as out_f:
                    out_f.write(file_buf)
                print(f"Extracted: {dest_name} ({len(file_buf)} bytes)")
                extracted_files.append(dest_name)
                
    print(f"\nExtraction complete! {len(extracted_files)} files saved to {output_dir}")

if __name__ == '__main__':
    dmg_file = r'D:\Nihal\Winopie\Opie.dmg'
    dest = r'D:\Nihal\Winopie\extracted_assets'
    extract_dmg(dmg_file, dest)
