import { useEffect, useRef } from "react";

interface Meteor {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  delay: number;
}

export function MeteorShower({ count = 20 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate meteors on mount
    const meteors: Meteor[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 5,
    }));

    if (containerRef.current) {
      containerRef.current.innerHTML = meteors
        .map(
          (meteor) => `
          <div
            class="meteor"
            style="
              --x: ${meteor.x}%;
              --y: ${meteor.y}%;
              --length: ${meteor.length}px;
              --speed: ${meteor.speed}s;
              --opacity: ${meteor.opacity};
              --delay: ${meteor.delay}s;
            "
          ></div>
        `
        )
        .join("");
    }
  }, [count]);

  return (
    <>
      <style>{`
        .meteor-shower {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .meteor {
          position: absolute;
          top: var(--y);
          left: var(--x);
          width: 2px;
          height: var(--length);
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(147, 197, 253, var(--opacity)),
            rgba(147, 197, 253, calc(var(--opacity) * 0.8)),
            rgba(255, 255, 255, calc(var(--opacity) * 1.2)),
            transparent
          );
          border-radius: 50%;
          transform: rotate(215deg);
          animation: meteor-fall var(--speed) linear infinite;
          animation-delay: var(--delay);
          opacity: 0;
          filter: blur(0.5px);
          box-shadow: 
            0 0 6px 1px rgba(147, 197, 253, 0.3),
            0 0 12px 2px rgba(147, 197, 253, 0.2);
        }

        .meteor::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent);
          border-radius: 50%;
          box-shadow: 0 0 10px 3px rgba(147, 197, 253, 0.6);
        }

        @keyframes meteor-fall {
          0% {
            opacity: 0;
            transform: rotate(215deg) translateY(-100px);
          }
          5% {
            opacity: var(--opacity);
          }
          30% {
            opacity: var(--opacity);
          }
          100% {
            opacity: 0;
            transform: rotate(215deg) translateY(calc(100vh + 200px));
          }
        }

        /* Add some twinkling stars in the background */
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <div ref={containerRef} className="meteor-shower" />
      {/* Static stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>
    </>
  );
}
