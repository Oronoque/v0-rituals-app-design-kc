"use client"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface DataPoint {
  date: string
  value: number
  label?: string
}

interface MetricsChartProps {
  data: DataPoint[]
  title: string
  type: "line" | "bar" | "area"
  color?: "blue" | "green" | "purple" | "orange" | "red"
  unit?: string
  height?: number
  showGrid?: boolean
  showLabels?: boolean
}

export function MetricsChart({
  data,
  title,
  type = "line",
  color = "blue",
  unit = "",
  height = 200,
  showGrid = true,
  showLabels = true,
}: MetricsChartProps) {
  const { maxValue, minValue, normalizedData, gridLines } = useMemo(() => {
    if (data.length === 0) return { maxValue: 0, minValue: 0, normalizedData: [], gridLines: [] }

    const values = data.map((d) => d.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    const normalized = data.map((point, index) => ({
      ...point,
      x: (index / (data.length - 1 || 1)) * 100,
      y: ((max - point.value) / range) * 80 + 10, // 10% padding top/bottom
    }))

    const gridCount = 4
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => ({
      y: (i / gridCount) * 80 + 10,
      value: max - (i / gridCount) * range,
    }))

    return { maxValue: max, minValue: min, normalizedData: normalized, gridLines }
  }, [data])

  const colorClasses = {
    blue: "stroke-blue-400 fill-blue-400/20 text-blue-400",
    green: "stroke-green-400 fill-green-400/20 text-green-400",
    purple: "stroke-purple-400 fill-purple-400/20 text-purple-400",
    orange: "stroke-orange-400 fill-orange-400/20 text-orange-400",
    red: "stroke-red-400 fill-red-400/20 text-red-400",
  }

  const pathData = useMemo(() => {
    if (normalizedData.length === 0) return ""

    if (type === "line") {
      return normalizedData.reduce((path, point, index) => {
        const command = index === 0 ? "M" : "L"
        return `${path} ${command} ${point.x} ${point.y}`
      }, "")
    }

    if (type === "area") {
      const linePath = normalizedData.reduce((path, point, index) => {
        const command = index === 0 ? "M" : "L"
        return `${path} ${command} ${point.x} ${point.y}`
      }, "")
      const firstPoint = normalizedData[0]
      const lastPoint = normalizedData[normalizedData.length - 1]
      return `${linePath} L ${lastPoint.x} 90 L ${firstPoint.x} 90 Z`
    }

    return ""
  }, [normalizedData, type])

  if (data.length === 0) {
    return (
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-[#AEAEB2] text-ios-subhead">No data available</div>
      </div>
    )
  }

  return (
    <div className="ios-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium text-ios-subhead">{title}</h3>
        <div className="text-right">
          <div className={cn("text-ios-headline font-bold", colorClasses[color])}>
            {data[data.length - 1]?.value}
            {unit}
          </div>
          <div className="text-ios-footnote text-[#AEAEB2]">Latest</div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible" preserveAspectRatio="none">
          {/* Grid Lines */}
          {showGrid &&
            gridLines.map((line, index) => (
              <g key={index}>
                <line
                  x1="0"
                  y1={line.y}
                  x2="100"
                  y2={line.y}
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-gray-600"
                />
                {showLabels && (
                  <text
                    x="-2"
                    y={line.y}
                    fontSize="3"
                    fill="currentColor"
                    className="text-[#AEAEB2]"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {Math.round(line.value)}
                    {unit}
                  </text>
                )}
              </g>
            ))}

          {/* Chart Path */}
          {type === "line" && <path d={pathData} fill="none" strokeWidth="1" className={colorClasses[color]} />}

          {type === "area" && <path d={pathData} strokeWidth="1" className={colorClasses[color]} />}

          {type === "bar" &&
            normalizedData.map((point, index) => (
              <rect
                key={index}
                x={point.x - 1}
                y={point.y}
                width="2"
                height={90 - point.y}
                className={colorClasses[color]}
              />
            ))}

          {/* Data Points */}
          {type === "line" &&
            normalizedData.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r="1" className={colorClasses[color]} />
            ))}
        </svg>

        {/* Date Labels */}
        {showLabels && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-ios-footnote text-[#AEAEB2] mt-2">
            <span>{new Date(data[0]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>
              {new Date(data[data.length - 1]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
