"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Star, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUnitByValue, type UnitOption } from "@/lib/units"

interface UnitInputProps {
  value?: string
  onChange: (value: string) => void
  unitValue: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function UnitInput({ 
  value = "", 
  onChange, 
  unitValue, 
  placeholder,
  disabled = false,
  className 
}: UnitInputProps) {
  const unit = getUnitByValue(unitValue)
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  if (!unit) {
    return (
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || "Enter value..."}
        disabled={disabled}
        className={className}
      />
    )
  }

  // Number Input
  if (unit.input_type === "number") {
    return (
      <div className="space-y-2">
        <Input
          type="number"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || `Enter ${unit.label.toLowerCase()}`}
          min={unit.min}
          max={unit.max}
          step={unit.step || 1}
          disabled={disabled}
          className={cn("text-center", className)}
        />
        {unit.min !== undefined && unit.max !== undefined && (
          <p className="text-xs text-gray-400 text-center">
            Range: {unit.min} - {unit.max}
          </p>
        )}
      </div>
    )
  }

  // Range/Slider Input
  if (unit.input_type === "range") {
    const numValue = parseFloat(localValue) || unit.min || 0
    const min = unit.min || 0
    const max = unit.max || 10

    // Special cases for different range types
    if (unit.value === "yes_no") {
      return (
        <div className="flex gap-2">
          <Button
            variant={localValue === "0" ? "default" : "outline"}
            onClick={() => handleChange("0")}
            disabled={disabled}
            className="flex-1"
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            No
          </Button>
          <Button
            variant={localValue === "1" ? "default" : "outline"}
            onClick={() => handleChange("1")}
            disabled={disabled}
            className="flex-1"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Yes
          </Button>
        </div>
      )
    }

    if (unit.value.includes("mood") || unit.value.includes("energy") || unit.value.includes("stars") || unit.value.includes("pain")) {
      return (
        <div className="space-y-3">
          <div className="flex justify-center gap-1">
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const starValue = min + i
              const isSelected = numValue >= starValue
              return (
                <Button
                  key={starValue}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange(starValue.toString())}
                  disabled={disabled}
                  className="p-1 h-8 w-8"
                >
                  <Star 
                    className={cn(
                      "w-5 h-5",
                      isSelected ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                    )} 
                  />
                </Button>
              )
            })}
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {numValue}/{max}
            </Badge>
          </div>
        </div>
      )
    }

    // Regular slider
    return (
      <div className="space-y-3">
        <Slider
          value={[numValue]}
          onValueChange={(values) => handleChange(values[0].toString())}
          min={min}
          max={max}
          step={unit.step || 1}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>{min}</span>
          <Badge variant="outline">{numValue}</Badge>
          <span>{max}</span>
        </div>
      </div>
    )
  }

  // Time Input
  if (unit.input_type === "time") {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="time"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={cn("pl-10", className)}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          24-hour format (HH:MM)
        </p>
      </div>
    )
  }

  // Blood Pressure Input
  if (unit.input_type === "blood_pressure") {
    const [systolic, diastolic] = localValue.split("/")
    
    const handleBPChange = (sys: string, dia: string) => {
      const newValue = `${sys}/${dia}`
      handleChange(newValue)
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={systolic || ""}
            onChange={(e) => handleBPChange(e.target.value, diastolic || "")}
            placeholder="120"
            min={50}
            max={250}
            disabled={disabled}
            className="text-center"
          />
          <Separator orientation="vertical" className="h-6" />
          <Input
            type="number"
            value={diastolic || ""}
            onChange={(e) => handleBPChange(systolic || "", e.target.value)}
            placeholder="80"
            min={30}
            max={150}
            disabled={disabled}
            className="text-center"
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Systolic / Diastolic (mmHg)
        </p>
      </div>
    )
  }

  // Text Input (default)
  return (
    <Input
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder || `Enter ${unit.label.toLowerCase()}`}
      disabled={disabled}
      className={className}
    />
  )
} 