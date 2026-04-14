import React from "react";

type CardData = {
  title: string;
  subtitle?: string;
  desc: string;
  color: string;
};

type SkewCardsProps = {
  cards?: CardData[];
};

const defaultCards: CardData[] = [
  { title: "Card one", desc: "Lorem ipsum dolor sit amet.", color: "#ffbc00" },
  { title: "Card two", desc: "Lorem ipsum dolor sit amet.", color: "#03a9f4" },
  { title: "Card three", desc: "Lorem ipsum dolor sit amet.", color: "#4dff03" },
];

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function getTextColor(backgroundColor: string): string {
  return getLuminance(backgroundColor) > 0.5 ? "text-gray-900" : "text-white";
}

export default function SkewCards({ cards = defaultCards }: SkewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 justify-items-center">
      {cards.map(({ title, subtitle, desc, color }, idx) => {
        const textColor = getTextColor(color);
        const isLight = getLuminance(color) > 0.5;
        return (
          <div key={idx} className="relative w-full max-w-[360px] rounded-2xl shadow-[0px_4px_16px_rgba(17,17,26,0.1),0px_8px_24px_rgba(17,17,26,0.1),0px_16px_56px_rgba(17,17,26,0.1)] flex flex-col">
            <div className="relative z-20 h-full rounded-lg p-4 sm:p-6 md:p-8 shadow-lg flex flex-col flex-grow" style={{ backgroundColor: color }}>
              {subtitle && (
                <div className={`text-[11px] sm:text-sm font-medium mb-2 sm:mb-3 ${textColor} opacity-90`} style={{ textShadow: isLight ? "0 1px 2px rgba(255,255,255,0.5)" : "0 1px 2px rgba(0,0,0,0.3)" }}>
                  {subtitle}
                </div>
              )}
              <h2 className={`text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 font-semibold ${textColor} flex-shrink-0`} style={{ textShadow: isLight ? "0 2px 4px rgba(255,255,255,0.5)" : "0 2px 4px rgba(0,0,0,0.3)" }}>
                {title}
              </h2>
              <p className={`text-sm sm:text-base leading-snug sm:leading-relaxed ${textColor} flex-grow opacity-90`} style={{ textShadow: isLight ? "0 1px 2px rgba(255,255,255,0.5)" : "0 1px 2px rgba(0,0,0,0.3)" }}>
                {desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
