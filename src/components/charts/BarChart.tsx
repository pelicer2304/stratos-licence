interface BarData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarData[];
  title: string;
}

export function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary font-medium">{item.label}</span>
                <span className="text-text-secondary">{item.value}</span>
              </div>
              <div className="h-3 bg-bg-primary/40 rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    opacity: 0.85,
                  }}
                >
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
