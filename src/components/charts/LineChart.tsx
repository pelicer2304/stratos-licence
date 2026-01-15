interface LineChartProps {
  data: number[];
  labels: string[];
  title: string;
  color: string;
}

export function LineChart({ data, labels, title, color }: LineChartProps) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="text-sm text-text-secondary">Últimos {data.length} dias</span>
        </div>
      </div>

      <div className="relative h-48 bg-bg-primary/30 rounded-xl p-4 border border-border-subtle">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={color}
            opacity={0.12}
          />

          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000"
          />

          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="transition-all duration-1000"
              />
            );
          })}
        </svg>

        <div className="absolute inset-x-4 bottom-0 flex justify-between text-xs text-text-muted pt-2 border-t border-border-subtle">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-text-muted">Mínimo: </span>
          <span className="text-text-secondary font-medium">{minValue}</span>
        </div>
        <div>
          <span className="text-text-muted">Máximo: </span>
          <span className="text-text-secondary font-medium">{maxValue}</span>
        </div>
        <div>
          <span className="text-text-muted">Média: </span>
          <span className="text-text-secondary font-medium">{Math.round(data.reduce((a, b) => a + b, 0) / data.length)}</span>
        </div>
      </div>
    </div>
  );
}
