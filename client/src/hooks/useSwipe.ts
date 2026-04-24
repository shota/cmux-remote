import { useCallback, useEffect, useRef, useState } from "react";
import Hammer from "hammerjs";

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  pointers?: number;
  threshold?: number;
}

const DEFAULT_THRESHOLD = 50;

export function useSwipe(options: UseSwipeOptions) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const ref = useCallback((el: HTMLElement | null) => {
    setElement(el);
  }, []);

  useEffect(() => {
    if (!element) return;

    const mc = new Hammer.Manager(element);
    mc.add(
      new Hammer.Pan({
        direction: Hammer.DIRECTION_HORIZONTAL,
        pointers: optionsRef.current.pointers ?? 1,
        threshold: optionsRef.current.threshold ?? DEFAULT_THRESHOLD,
      })
    );

    let handled = false;

    mc.on("panstart", () => {
      handled = false;
    });

    mc.on("panend", (e) => {
      if (handled) return;
      handled = true;

      const { deltaX } = e;
      const absX = Math.abs(deltaX);
      const threshold = optionsRef.current.threshold ?? DEFAULT_THRESHOLD;
      if (absX < threshold) return;

      if (deltaX < 0) optionsRef.current.onSwipeLeft();
      else optionsRef.current.onSwipeRight();

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });

    return () => {
      mc.destroy();
    };
  }, [element]);

  return ref;
}
