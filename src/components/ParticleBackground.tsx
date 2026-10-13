'use client';
import { useEffect } from 'react';

export default function ParticleBackground() {
  useEffect(() => {
    // Dynamically load particles.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.particlesJS) {
        // @ts-ignore
        window.particlesJS('particles-js', {
          "particles": {
              "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
              "color": { "value": "#D90429" },
              "shape": { "type": "circle" },
              "opacity": { "value": 0.6, "random": false },
              "size": { "value": 4, "random": true },
              "line_linked": {
                  "enable": true,
                  "distance": 150,
                  "color": "#D90429",
                  "opacity": 0.4,
                  "width": 1.5
              },
              "move": {
                  "enable": true,
                  "speed": 1.5,
                  "direction": "none",
                  "random": false,
                  "straight": false,
                  "out_mode": "out",
                  "bounce": false
              }
          },
          "interactivity": {
              "detect_on": "canvas",
              "events": {
                  "onhover": { "enable": true, "mode": "grab" },
                  "onclick": { "enable": false },
                  "resize": true
              },
              "modes": {
                  "grab": { "distance": 200, "line_linked": { "opacity": 0.3 } }
              }
          },
          "retina_detect": true
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="particles-js" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}></div>;
}
