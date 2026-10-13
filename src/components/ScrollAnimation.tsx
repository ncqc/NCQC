'use client';
import { useEffect } from 'react';

export default function ScrollAnimation() {
  useEffect(() => {
    // 1. Reveal Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px"
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    const elementsToReveal = document.querySelectorAll('.reveal-fade, .card-clean, .about-box, .stat-3d-card, .comp-card, .album-item');
    elementsToReveal.forEach(el => scrollObserver.observe(el));

    // 2. Counter Animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target as HTMLElement;
                const targetAttr = counter.getAttribute('data-target');
                if (!targetAttr) return;
                
                const target = +targetAttr;
                const duration = 2000;
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
  }, []);

  return null;
}
