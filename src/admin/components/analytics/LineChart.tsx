interface LineSeries {
  name: string;
  color: string;
  values: Array<number | null>;
  current?: boolean;
}

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  ariaLabel: string;
  ySuffix?: string;
  showHistoricalBand?: boolean;
}

const width = 760;
const height = 280;
const plot = { left: 48, right: 18, top: 18, bottom: 38 };
const plotWidth = width - plot.left - plot.right;
const plotHeight = height - plot.top - plot.bottom;

function point(index: number, value: number, length: number) {
  return {
    x: plot.left + (index * plotWidth) / Math.max(length - 1, 1),
    y: plot.top + plotHeight - (value / 100) * plotHeight,
  };
}

function toPath(values: Array<number | null>) {
  let isDrawing = false;
  return values
    .map((value, index) => {
      if (value === null) {
        isDrawing = false;
        return "";
      }
      const current = point(index, value, values.length);
      const command = isDrawing ? "L" : "M";
      isDrawing = true;
      return `${command}${current.x},${current.y}`;
    })
    .join(" ");
}

function historicalBand(series: LineSeries[]) {
  const history = series.filter((item) => !item.current);
  if (!history.length) return "";
  const upper = history[0].values.map((_, index) =>
    Math.max(...history.map((item) => item.values[index] ?? 0)),
  );
  const lower = history[0].values.map((_, index) =>
    Math.min(...history.map((item) => item.values[index] ?? 0)),
  );
  const upperPoints = upper.map((value, index) => point(index, value, upper.length));
  const lowerPoints = lower
    .map((value, index) => point(index, value, lower.length))
    .reverse();
  return [...upperPoints, ...lowerPoints].map(({ x, y }) => `${x},${y}`).join(" ");
}

export function LineChart({
  labels,
  series,
  ariaLabel,
  ySuffix = "%",
  showHistoricalBand = false,
}: LineChartProps) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-admin-muted">
        {series.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.name}>
            <span
              className={`h-1 w-6 rounded-full ${item.current ? "ring-2 ring-white/20" : ""}`}
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg
          aria-label={ariaLabel}
          className="min-w-[42rem]"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = point(0, tick, labels.length).y;
            return (
              <g key={tick}>
                <line stroke="rgba(213,227,231,.18)" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
                <text fill="#d5e3e7" fontSize="11" textAnchor="end" x={plot.left - 9} y={y + 4}>
                  {tick}{ySuffix}
                </text>
              </g>
            );
          })}
          {labels.map((label, index) => {
            const x = point(index, 0, labels.length).x;
            return (
              <text fill="#d5e3e7" fontSize="11" key={label} textAnchor="middle" x={x} y={height - 10}>
                {label}
              </text>
            );
          })}
          {showHistoricalBand && (
            <polygon fill="rgba(150,178,187,.16)" points={historicalBand(series)} stroke="none" />
          )}
          {series.map((item) => (
            <g key={item.name}>
              <path
                d={toPath(item.values)}
                fill="none"
                opacity={item.current ? 1 : 0.72}
                stroke={item.color}
                strokeDasharray={item.current ? undefined : "4 4"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={item.current ? 4 : 2}
              />
              {item.values.map((value, index) => {
                if (value === null) return null;
                const current = point(index, value, item.values.length);
                return (
                  <circle cx={current.x} cy={current.y} fill={item.color} key={`${item.name}-${index}`} r={item.current ? 4 : 2.5}>
                    <title>{`${item.name} ${labels[index]}：${value}${ySuffix}`}</title>
                  </circle>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
