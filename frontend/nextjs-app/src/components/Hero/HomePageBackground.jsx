"use client";

/**
 * 메인 페이지 전용 전체 화면 배경 (position: fixed, viewport 전체).
 * 라이트: 낙엽이 자연스럽게 떨어짐 / 다크: 밤하늘 + 유성
 */
const LEAF_COUNT = 20;
const STATIC_STARS = 55;
const METEOR_COUNT = 12;

function LeavesLayer() {
  const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => ({
    id: i,
    left: (i * 27 + 11) % 98,
    delay: (i * 1.2 + (i % 4) * 3.5) % 22,
    duration: 9 + (i % 5) * 2.5,
    size: 0.8 + (i % 4) * 0.25,
    rotateStart: (i * 41) % 360,
    sway: (i % 2 === 0 ? 1 : -1) * (12 + (i % 5) * 4),
  }));

  return (
    <div className="home-bg-leaves" aria-hidden="true">
      <div className="home-bg-leaves-gradient" />
      {leaves.map(({ id, left, delay, duration, size, rotateStart, sway }) => (
        <div
          key={id}
          className="home-bg-leaf"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            ["--leaf-scale"]: size,
            ["--leaf-rotate-start"]: `${rotateStart}deg`,
            ["--leaf-sway"]: `${sway}px`,
          }}
        >
          <svg viewBox="0 0 24 40" className="home-bg-leaf-svg" aria-hidden="true">
            <path
              d="M12 1 Q4 18 12 39 Q20 18 12 1 Z"
              fill="currentColor"
              opacity="0.88"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

function NightSkyLayer() {
  const stars = Array.from({ length: STATIC_STARS }, (_, i) => ({
    id: i,
    left: (i * 17 + 7) % 100,
    top: (i * 19 + 2) % 100,
    size: (i % 3) + 1,
    opacity: 0.3 + (i % 7) * 0.1,
    twinkle: i % 5 === 0,
  }));

  const meteors = Array.from({ length: METEOR_COUNT }, (_, i) => ({
    id: i,
    left: (i * 19 + 3) % 92,
    top: -8 - (i % 5) * 2,
    delay: i * 2.1 + (i % 4) * 0.9 + Math.sin(i) * 0.5,
    duration: 2 + (i % 6) * 0.4 + (i % 3) * 0.2,
    angle: -58 - (i % 9) * 6,
    width: 130 + (i % 5) * 28,
  }));

  return (
    <div className="home-bg-night" aria-hidden="true">
      <div className="home-bg-night-gradient" />
      <div className="home-bg-night-stars">
        {stars.map(({ id, left, top, size, opacity, twinkle }) => (
          <span
            key={id}
            className={`home-bg-star-dot ${twinkle ? "home-bg-star-dot--twinkle" : ""}`}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity }}
          />
        ))}
      </div>
      <div className="home-bg-night-meteors">
        {meteors.map(({ id, left, top, delay, duration, angle, width }) => (
          <div
            key={id}
            className="home-bg-meteor"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              ["--meteor-angle"]: `${angle}deg`,
              ["--meteor-width"]: `${width}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePageBackground() {
  return (
    <div className="home-bg">
      <LeavesLayer />
      <NightSkyLayer />
    </div>
  );
}
