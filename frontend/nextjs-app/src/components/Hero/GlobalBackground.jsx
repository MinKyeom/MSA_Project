"use client";

/**
 * 전체 웹사이트 배경 (가을 이미지 / 밤하늘 이미지 톤).
 * 라이트: 나무길 가을 – 따뜻한 갈색·오렌지·노랑, 자연스러운 낙엽
 * 다크: 별과 은하수 느낌 밤하늘 – 깊은 남색, 자연스러운 유성
 */
const LEAF_COUNT = 18;
const LEAF_COLORS = ["#b85c38", "#c9762c", "#a65c2e", "#8b6914", "#9c7c3c", "#8b4513", "#a0522d", "#c4a035"];
const STAR_COUNT = 95;
const METEOR_COUNT = 10;

function LeavesLayer() {
  const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => ({
    id: i,
    left: (i * 19 + 12) % 94,
    delay: (i * 2.8 + (i % 4) * 4.5) % 32,
    duration: 16 + (i % 5) * 3,
    size: 0.65 + (i % 4) * 0.22,
    rotateStart: (i * 47) % 360,
    sway: (i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 2),
    color: LEAF_COLORS[i % LEAF_COLORS.length],
  }));

  return (
    <div className="global-bg-leaves" aria-hidden="true">
      <div className="global-bg-leaves-sky" />
      {leaves.map(({ id, left, delay, duration, size, rotateStart, sway, color }) => (
        <div
          key={id}
          className="global-bg-leaf"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            ["--leaf-scale"]: size,
            ["--leaf-rotate-start"]: `${rotateStart}deg`,
            ["--leaf-sway"]: `${sway}px`,
            ["--leaf-color"]: color,
          }}
        >
          <svg viewBox="0 0 24 40" className="global-bg-leaf-svg" aria-hidden="true">
            <path d="M12 1 Q4 18 12 39 Q20 18 12 1 Z" fill="currentColor" opacity="0.92" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function NightSkyLayer() {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: (i * 11 + 3) % 100,
    top: (i * 13 + 2) % 100,
    size: (i % 3) + 1,
    opacity: 0.2 + (i % 9) * 0.09,
    twinkle: i % 7 === 0,
  }));

  const meteors = [
    { id: 0, left: 12, top: -3, delay: 0, duration: 2.2, angle: -58, width: 140 },
    { id: 1, left: 48, top: -8, delay: 4.2, duration: 2.6, angle: -65, width: 180 },
    { id: 2, left: 82, top: -5, delay: 8.8, duration: 1.9, angle: -52, width: 120 },
    { id: 3, left: 28, top: -6, delay: 13.5, duration: 2.4, angle: -62, width: 160 },
    { id: 4, left: 68, top: -4, delay: 18, duration: 2.1, angle: -55, width: 130 },
    { id: 5, left: 5, top: -7, delay: 22.5, duration: 2.7, angle: -68, width: 190 },
    { id: 6, left: 55, top: -2, delay: 27, duration: 2.0, angle: -50, width: 110 },
    { id: 7, left: 90, top: -6, delay: 31, duration: 2.5, angle: -60, width: 150 },
    { id: 8, left: 35, top: -4, delay: 35.5, duration: 2.3, angle: -63, width: 170 },
    { id: 9, left: 72, top: -9, delay: 40, duration: 2.8, angle: -70, width: 200 },
  ];

  return (
    <div className="global-bg-night" aria-hidden="true">
      <div className="global-bg-night-sky" />
      <div className="global-bg-milky" />
      <div className="global-bg-stars">
        {stars.map(({ id, left, top, size, opacity, twinkle }) => (
          <span
            key={id}
            className={`global-bg-star ${twinkle ? "global-bg-star--twinkle" : ""}`}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity }}
          />
        ))}
      </div>
      <div className="global-bg-meteors">
        {meteors.map(({ id, left, top, delay, duration, angle, width }) => (
          <div
            key={id}
            className="global-bg-meteor"
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

export default function GlobalBackground() {
  return (
    <div className="global-bg">
      <LeavesLayer />
      <NightSkyLayer />
    </div>
  );
}
