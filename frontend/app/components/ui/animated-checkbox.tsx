"use client"
import { cn } from "@/lib/utils"

interface AnimatedCheckboxProps {
  isCompleted: boolean
  onComplete: () => void
  disabled?: boolean
  size?: "large" | "medium"
}

export function AnimatedCheckbox({ isCompleted, onComplete, disabled = false, size = "large" }: AnimatedCheckboxProps) {
  const sizeClasses = size === "large" ? "w-16 h-16" : "w-12 h-12"

  return (
    <button
      onClick={onComplete}
      disabled={disabled}
      className={cn(
        "relative rounded-2xl border-2 transition-all duration-300 touch-manipulation",
        sizeClasses,
        disabled
          ? "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
          : isCompleted
            ? "border-green-500 bg-green-500 scale-110 shadow-lg shadow-green-500/30"
            : "border-gray-500 bg-gray-700/50 hover:border-blue-400 hover:bg-blue-500/10 active:scale-95",
        "flex items-center justify-center",
      )}
    >
      <svg
        className={cn("transition-all duration-500", size === "large" ? "w-8 h-8" : "w-6 h-6")}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M20 6L9 17L4 12"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-all duration-700 ease-out",
            isCompleted
              ? "stroke-dasharray-0 stroke-dashoffset-0 opacity-100"
              : "stroke-dasharray-24 stroke-dashoffset-24 opacity-0",
          )}
          style={{
            strokeDasharray: isCompleted ? "0" : "24",
            strokeDashoffset: isCompleted ? "0" : "24",
          }}
        />
      </svg>

      {isCompleted && <div className="absolute inset-0 rounded-2xl bg-green-400/20 animate-ping" />}
    </button>
  )
}
