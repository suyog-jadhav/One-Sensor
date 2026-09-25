import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to smoothly interpolate a numeric value with a 260ms cubic ease-out curve.
 * Conforms to motion-value specification.
 * Respects prefers-reduced-motion and tab visibility.
 *
 * @param {number|string} targetValue - Target numeric value to ease toward
 * @param {object} options
 * @param {number} [options.duration=260] - Duration in ms (default 260ms)
 * @param {number} [options.decimals=1] - Decimal precision to format
 * @param {boolean} [options.isActive=true] - Whether animations should run
 * @returns {number} The current smoothly interpolated value
 */
export function useSmoothedValue(targetValue, { duration = 260, decimals = 1, isActive = true } = {}) {
  const numericTarget = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue);
  const isTargetValid = !isNaN(numericTarget);

  const [currentVal, setCurrentVal] = useState(isTargetValid ? numericTarget : 0);
  const currentValRef = useRef(currentVal);
  const animFrameRef = useRef(null);

  useEffect(() => {
    currentValRef.current = currentVal;
  }, [currentVal]);

  useEffect(() => {
    if (!isTargetValid) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !isActive || duration <= 0) {
      setCurrentVal(numericTarget);
      return;
    }

    const startVal = currentValRef.current;
    if (Math.abs(startVal - numericTarget) < 0.0001) {
      return;
    }

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + (numericTarget - startVal) * eased;

      setCurrentVal(nextVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentVal(numericTarget);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [numericTarget, duration, isActive, isTargetValid]);

  return isTargetValid ? Number(currentVal.toFixed(decimals)) : targetValue;
}

export default useSmoothedValue;
