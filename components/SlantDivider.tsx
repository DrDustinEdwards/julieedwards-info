type Props = {
  topBg: string;
  bottomBg: string;
  layers?: number;
};

const SLANT_VB = 60;

export default function SlantDivider({ topBg, bottomBg, layers = 5 }: Props) {
  const last = layers - 1;
  const step = last === 0 ? 0 : (100 - SLANT_VB) / last;

  return (
    <div
      className="slant-divider"
      aria-hidden="true"
      style={{ background: `var(${topBg})` }}
    >
      {Array.from({ length: layers }, (_, i) => {
        const yTopRight = i * step;
        const yTopLeft = yTopRight + SLANT_VB;
        const pct = ((i + 1) / layers) * 100;
        const fill = `color-mix(in oklab, var(${topBg}), var(${bottomBg}) ${pct}%)`;
        return (
          <svg
            key={i}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points={`0,${yTopLeft} 100,${yTopRight} 100,100 0,100`}
              fill={fill}
            />
          </svg>
        );
      })}
    </div>
  );
}
