import { useEffect, useRef, useState } from "react";

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 420,
  damping: 26,
  mass: 0.8,
};

export function useSpringValue(target: number, config: SpringConfig = DEFAULT_SPRING) {
  const [current, setCurrent] = useState(target);
  const valRef = useRef(target);
  const velRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.032); // clamp dt to max 32ms
      lastTime = time;

      const displacement = valRef.current - target;
      const springForce = -config.stiffness * displacement;
      const dampingForce = -config.damping * velRef.current;
      const acceleration = (springForce + dampingForce) / config.mass;

      velRef.current += acceleration * dt;
      valRef.current += velRef.current * dt;

      setCurrent(valRef.current);

      if (Math.abs(valRef.current - target) > 0.001 || Math.abs(velRef.current) > 0.001) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        valRef.current = target;
        velRef.current = 0;
        setCurrent(target);
        rafRef.current = null;
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, config.stiffness, config.damping, config.mass]);

  return current;
}
