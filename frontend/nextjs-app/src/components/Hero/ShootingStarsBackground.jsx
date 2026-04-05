"use client";

/**
 * 밤하늘을 쳐다보는 듯한 배경: 고정 별 + 유성이 떨어지는 연출.
 * 메인 페이지 전체 뒤에서 재생.
 */
const STATIC_STARS = 60;
const METEORS = 6;

export default function ShootingStarsBackground() {
  const staticStars = Array.from({ length: STATIC_STARS }, (_, i) => ({
    id: i,
    left: (i * 17 + 13) % 100,
    top: (i * 23 + 7) % 100,
    size: (i % 3) + 1,
    opacity: 0.4 + (i % 7) * 0.08,
    twinkle: i % 4 === 0,
  }));

  const meteors = [
    { id: 0, startX: 15, startY: -5, delay: 0, duration: 2.2 },
    { id: 1, startX: 45, startY: -8, delay: 4.2, duration: 2.5 },
    { id: 2, startX: 72, startY: -12, delay: 8.5, duration: 2 },
    { id: 3, startX: 28, startY: -3, delay: 12, duration: 2.8 },
    { id: 4, startX: 88, startY: -6, delay: 16, duration: 2.3 },
    { id: 5, startX: 55, startY: -10, delay: 20, duration: 2.6 },
  ];

  return (
    <div className="night-sky" aria-hidden="true">
      {/* 고정 별 (밤하늘 분위기) */}
      <div className="night-sky-stars">
        {staticStars.map(({ id, left, top, size, opacity, twinkle }) => (
          <span
            key={id}
            className={`night-sky-dot ${twinkle ? "night-sky-dot--twinkle" : ""}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
            }}
          />
        ))}
      </div>
      {/* 유성 (떨어지는 꼬리) */}
      <div className="night-sky-meteors">
        {meteors.map(({ id, startX, startY, delay, duration }) => (
          <div
            key={id}
            className="meteor"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
