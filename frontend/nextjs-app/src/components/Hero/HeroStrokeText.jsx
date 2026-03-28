"use client";

import { useRef, useEffect, useState, useId } from "react";

// Handwriting Reveal: 28s 무한 루프 (타이틀과 동기화), 마스크 선이 지나간 자리만 fill 노출
const TOTAL_LOOP = 28;
// 손글씨 느낌: 초반에 빠르고 끝에서 쫀득하게 맺힘
const HANDWRITING_EASING = "cubic-bezier(0.2, 0, 0.2, 1)";

/**
 * SVG Mask 기반 Handwriting Reveal 애니메이션.
 * - 글자 본체(Fill)는 고정, 마스크 내 두꺼운 선이 stroke-dashoffset으로 획을 따라 그려짐.
 * - 마스크 선이 지나가는 자리만 면이 실시간 노출(선은 화면에 안 보이고 '통로' 역할만).
 * - Caveat 등 필기체 폰트, stroke-linecap: round, stroke 두께 1.5~2배로 빈틈 없이 채움.
 */
export default function HeroStrokeText({
  text,
  stepDelay = 0.15,
  startDelay = 0,
  className = "",
  variant = "title",
  as: Tag = "h1",
}) {
  const chars = text.split("");
  const isSubtitle = variant === "subtitle";
  const svgRef = useRef(null);
  const maskIdBase = useId().replace(/:/g, "-");
  const [state, setState] = useState({
    widths: [],
    lengths: [],
    xPositions: [],
    totalWidth: 0,
    ready: false,
  });

  useEffect(() => {
    if (!svgRef.current) return;
    const textNodes = svgRef.current.querySelectorAll("text.hero-stroke-path");
    if (textNodes.length === 0) return;
    const charList = text.split("");
    const widths = [];
    textNodes.forEach((t) => widths.push(t.getComputedTextLength()));
    let nonSpaceSum = 0, nonSpaceCount = 0;
    widths.forEach((w, i) => {
      if (charList[i] !== " ") {
        nonSpaceSum += w;
        nonSpaceCount++;
      }
    });
    const avgChar = nonSpaceCount > 0 ? nonSpaceSum / nonSpaceCount : 20;
    charList.forEach((c, i) => {
      if (c === " ") widths[i] = avgChar * 0.55;
    });
    const total = widths.reduce((a, b) => a + b, 0);
    // 1.3배: 선 길이를 실제 글자에 가깝게 해 애니메이션 시작과 동시에 잉크가 즉시 나타나게
    const lengths = widths.map((w) => Math.max(w * 1.3, 1));
    const xPositions = [];
    let acc = 0;
    widths.forEach((w) => {
      xPositions.push(acc);
      acc += w;
    });
    setState({
      widths,
      lengths,
      xPositions: xPositions.map((x) => x - total / 2),
      totalWidth: total,
      ready: true,
    });
  }, [text]);

  const fontSize = isSubtitle ? "1.6rem" : "4rem";
  // 마스크 선 두께: 얇은 붓으로 자연스러운 필기감 (선은 화면에 안 보임)
  const maskStrokeWidth = 14;
  const { ready, lengths, xPositions, totalWidth } = state;

  const textStyle = {
    fontFamily: "var(--font-caveat), Caveat, cursive",
    fontSize,
    fontWeight: 400,
  };

  // 측정 완료 전에는 아무것도 보이지 않도록 숨김(측정용 DOM은 유지)
  if (!ready) {
    return (
      <Tag className={`hero-stroke-wrap ${className}`} style={{ margin: 0 }} aria-hidden="true">
        <svg
          ref={svgRef}
          className="hero-stroke-svg"
          viewBox="0 0 400 80"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible", visibility: "hidden", position: "absolute", pointerEvents: "none" }}
          aria-hidden="true"
        >
        <g textAnchor="start" dominantBaseline="middle">
          {chars.map((char, i) => (
              <text
                key={`${i}-${char}`}
                className="hero-stroke-path"
                x="0"
                y="0"
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive", fontSize, fontWeight: 400 }}
              >
                {char}
              </text>
            ))}
          </g>
        </svg>
      </Tag>
    );
  }

  return (
    <Tag
      className={`hero-stroke-wrap ${className}`}
      style={{ margin: 0 }}
      aria-hidden="false"
    >
      <svg
        ref={svgRef}
        className="hero-stroke-svg"
        viewBox={`${-totalWidth / 2 - 24} -30 ${totalWidth + 48} 60`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <g textAnchor="start" dominantBaseline="middle">
          {chars.map((char, i) => {
            const delay = startDelay + i * stepDelay;
            const pathLen = lengths[i];
            const maskId = `hero-mask-${maskIdBase}-${i}`;
            return (
              <g
                key={`${i}-${char}`}
                className="hero-stroke-char-group"
                transform={`translate(${xPositions[i]}, 0)`}
                style={{ animationFillMode: "backwards", ["--mask-stroke-width"]: maskStrokeWidth }}
              >
                <defs>
                  <mask id={maskId}>
                    <text
                      className="hero-mask-stroke"
                      x="0"
                      y="0"
                      textAnchor="start"
                      dominantBaseline="middle"
                      style={{
                        ...textStyle,
                        fill: "white",
                        stroke: "white",
                        ["--mask-stroke-width"]: maskStrokeWidth,
                        strokeWidth: "var(--mask-stroke-width)",
                        paintOrder: "stroke",
                        strokeMiterlimit: 10,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeDasharray: pathLen,
                        strokeDashoffset: pathLen,
                        animation: `heroStrokeDrawLoop ${TOTAL_LOOP}s ${HANDWRITING_EASING} infinite`,
                        animationDelay: `${delay}s`,
                        animationFillMode: "backwards",
                        ["--hero-len"]: pathLen,
                      }}
                    >
                      {char}
                    </text>
                  </mask>
                </defs>
                <text
                  className="hero-stroke-fill"
                  x="0"
                  y="0"
                  textAnchor="start"
                  dominantBaseline="middle"
                  mask={`url(#${maskId})`}
                  style={{
                    ...textStyle,
                    fill: "currentColor",
                    animation: `heroFillOpacityLoop ${TOTAL_LOOP}s ${HANDWRITING_EASING} infinite`,
                    animationDelay: `${delay}s`,
                    animationFillMode: "backwards",
                  }}
                >
                  {char}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </Tag>
  );
}
