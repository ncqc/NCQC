'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollAnimation() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Reveal Animation
    const observerOptions = {
      threshold: 0.05,
      rootMargin: "0px 0px 50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const elementsToReveal = document.querySelectorAll('.reveal-fade, .card-clean, .about-box, .stat-3d-card, .comp-card, .album-item');
    elementsToReveal.forEach(el => {
      // Immediately reveal elements that are already within or near viewport
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 150) {
        el.classList.add('is-visible');
      }
      scrollObserver.observe(el);
    });

    // 2. Counter Animation
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target as HTMLElement;
          const targetAttr = counter.getAttribute('data-target');
          if (!targetAttr) return;
          
          const target = +targetAttr;
          const duration = 1500;
          const step = target / (duration / 16); 
          
          let current = 0;
          const updateCounter = () => {
            current += step;
            if (current < target) {
              counter.innerText = Math.ceil(current).toString();
              requestAnimationFrame(updateCounter);
            } else {
              counter.innerText = target.toString();
            }
          };
          
          if (counter.innerText === "0" || counter.innerText === "") {
            updateCounter();
          }
        }
      });
    }, observerOptions);

    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => counterObserver.observe(counter));

    return () => {
      scrollObserver.disconnect();
      counterObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
