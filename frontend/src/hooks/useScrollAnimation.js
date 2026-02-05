import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visibility to trigger animation (0-1)
 * @param {string} options.animationClass - CSS class to add when element is visible
 * @returns {Object} - { ref: elementRef, isVisible: boolean }
 */
export const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.1,
    animationClass = 'animate-fade-in-up'
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          if (elementRef.current) {
            elementRef.current.classList.add(animationClass);
          }
        }
      },
      { threshold }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, animationClass, isVisible]);

  return { ref: elementRef, isVisible };
};

/**
 * Hook for parallax scroll effect
 * @param {number} speed - Parallax speed (0.1 = slow, 1 = normal)
 * @returns {Object} - { ref: elementRef, transform: transformString }
 */
export const useParallax = (speed = 0.5) => {
  const elementRef = useRef(null);
  const [transform, setTransform] = useState('translateY(0px)');

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const scrolled = window.pageYOffset;
      const rate = scrolled * speed;

      setTransform(`translateY(${rate}px)`);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref: elementRef, transform };
};

export default useScrollAnimation;
