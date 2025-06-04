
import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (threshold = 0.3) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger when the bottom of the element is visible
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { 
        threshold,
        rootMargin: '-50px 0px -20% 0px' // Only trigger when element is well into view
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};
