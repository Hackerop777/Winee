// Pure Web Audio API Synthesized SFX Engine
// 100% self-contained: zero external file dependencies, zero network fetch, microsecond latency.

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Pre-warming the AudioContext
  loadSounds() {
    try {
      this.getAudioContext();
    } catch (_) {}
  }

  play(name: string, volume = 0.5) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (name) {
        case "focus-wood.wav":
        case "focus": {
          // Warm resonant knock (radial spawn)
          osc.type = "sine";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.045);
          gain.gain.setValueAtTime(volume * 0.45, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case "ring-switch.wav":
        case "switch": {
          // Crisp high-frequency metallic tick (wedge change)
          osc.type = "triangle";
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.018);
          gain.gain.setValueAtTime(volume * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          osc.start(now);
          osc.stop(now + 0.02);
          break;
        }

        case "button-press.wav":
        case "press": {
          // Snappy affirmative selection click
          osc.type = "sine";
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
          gain.gain.setValueAtTime(volume * 0.55, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }

        case "button-release.wav":
        case "release": {
          // Soft mechanical dismiss tick
          osc.type = "sine";
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);
          gain.gain.setValueAtTime(volume * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        default: {
          osc.type = "sine";
          osc.frequency.setValueAtTime(500, now);
          gain.gain.setValueAtTime(volume * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }
      }
    } catch (_) {
      // Audio playback fails gracefully if audio device is unavailable
    }
  }
}

export const sounds = new SoundEngine();
