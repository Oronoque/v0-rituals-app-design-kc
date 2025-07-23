"use client"
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUnitByValue, type CustomStepAnswer } from '@/lib/units'

interface CustomStepInputProps {
  unit: string
  value?: CustomStepAnswer
  onChange: (answer: CustomStepAnswer) => void
  isActive?: boolean
  className?: string
}

export function CustomStepInput({ 
  unit, 
  value, 
  onChange, 
  isActive = false, 
  className 
}: CustomStepInputProps) {
  const unitConfig = getUnitByValue(unit)
  const [systolic, setSystolic] = useState<string>(value?.systolic?.toString() || '')
  const [diastolic, setDiastolic] = useState<string>(value?.diastolic?.toString() || '')
  const [customUnit, setCustomUnit] = useState<string>(value?.custom_unit || '')

  if (!unitConfig) {
    return (
      <div className="text-red-400 text-sm">
        Unknown unit type: {unit}
      </div>
    )
  }

  const handleValueChange = (newValue: string | number, additionalData?: any) => {
    const answer: CustomStepAnswer = {
      value: newValue,
      unit,
      ...additionalData
    }
    onChange(answer)
  }

  const currentValue = typeof value?.value === 'string' ? value.value : (value?.value?.toString() || '')

  switch (unitConfig.input_type) {
    case 'number':
      return (
        <div className={cn("flex items-center space-x-3", className)}>
          <Input
            type="number"
            placeholder="0"
            value={currentValue}
            onChange={(e) => {
              const numValue = parseFloat(e.target.value) || 0
              handleValueChange(numValue)
            }}
            className={cn(
              "flex-1 h-12 text-center text-ios-subhead font-medium transition-all duration-200",
              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
              "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
              isActive && "focus:border-blue-400 focus:ring-blue-400/20"
            )}
            min={unitConfig.min}
            max={unitConfig.max}
            step={unitConfig.step || 1}
            inputMode="decimal"
          />
          <span className="text-[#AEAEB2] text-ios-subhead min-w-12 font-medium">
            {unitConfig.label.split('(')[1]?.replace(')', '') || unit}
          </span>
          {value && (
            <div className="flex items-center text-green-400">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      )

    case 'range':
      const rangeValue = parseInt(currentValue) || unitConfig.min || 1
      return (
        <div className={cn("space-y-3", className)}>
          <div className="flex items-center justify-between">
            <span className="text-[#AEAEB2] text-sm">{unitConfig.min}</span>
            <span className="text-white text-lg font-semibold">{rangeValue}</span>
            <span className="text-[#AEAEB2] text-sm">{unitConfig.max}</span>
          </div>
          <Slider
            value={[rangeValue]}
            onValueChange={(values) => handleValueChange(values[0])}
            min={unitConfig.min || 1}
            max={unitConfig.max || 5}
            step={1}
            className="w-full"
          />
          <div className="text-center">
            <span className="text-[#AEAEB2] text-sm">
              {unitConfig.label}
            </span>
            {value && (
              <div className="flex items-center justify-center text-green-400 mt-2">
                <Check className="w-4 h-4 mr-1" />
                Value recorded
              </div>
            )}
          </div>
        </div>
      )

    case 'time':
      return (
        <div className={cn("flex items-center space-x-3", className)}>
          <div className="flex items-center bg-[#4C4C4E] border border-[#5C5C5E] rounded-lg px-3 py-2 flex-1">
            <Clock className="w-4 h-4 text-[#AEAEB2] mr-2" />
            <Input
              type="time"
              value={currentValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className={cn(
                "border-0 bg-transparent text-white focus:ring-0 focus:ring-offset-0 h-auto p-0",
                isActive && "text-blue-400"
              )}
            />
          </div>
          {value && (
            <div className="flex items-center text-green-400">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      )

    case 'blood_pressure':
      return (
        <div className={cn("space-y-3", className)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#AEAEB2] mb-1 block">Systolic</label>
              <Input
                type="number"
                placeholder="120"
                value={systolic}
                onChange={(e) => {
                  setSystolic(e.target.value)
                  const sys = parseInt(e.target.value) || 0
                  const dia = parseInt(diastolic) || 0
                  if (sys > 0) {
                    handleValueChange(`${sys}/${dia}`, { systolic: sys, diastolic: dia })
                  }
                }}
                className="bg-[#4C4C4E] border-[#5C5C5E] text-white text-center"
                min={50}
                max={250}
              />
            </div>
            <div>
              <label className="text-xs text-[#AEAEB2] mb-1 block">Diastolic</label>
              <Input
                type="number"
                placeholder="80"
                value={diastolic}
                onChange={(e) => {
                  setDiastolic(e.target.value)
                  const sys = parseInt(systolic) || 0
                  const dia = parseInt(e.target.value) || 0
                  if (dia > 0) {
                    handleValueChange(`${sys}/${dia}`, { systolic: sys, diastolic: dia })
                  }
                }}
                className="bg-[#4C4C4E] border-[#5C5C5E] text-white text-center"
                min={30}
                max={150}
              />
            </div>
          </div>
          <div className="text-center">
            <span className="text-[#AEAEB2] text-sm">mmHg</span>
            {value && (
              <div className="flex items-center justify-center text-green-400 mt-2">
                <Check className="w-4 h-4 mr-1" />
                Blood pressure recorded
              </div>
            )}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className={cn("space-y-3", className)}>
          {unit === 'custom' && (
            <div>
              <label className="text-xs text-[#AEAEB2] mb-1 block">Custom Unit</label>
              <Input
                placeholder="e.g., recipes, oil changes"
                value={customUnit}
                onChange={(e) => {
                  setCustomUnit(e.target.value)
                  handleValueChange(currentValue || '', { custom_unit: e.target.value })
                }}
                className="bg-[#4C4C4E] border-[#5C5C5E] text-white"
              />
            </div>
          )}
          <div className="flex items-center space-x-3">
            <Input
              placeholder="Enter value..."
              value={currentValue}
              onChange={(e) => handleValueChange(e.target.value, { custom_unit: customUnit })}
              className={cn(
                "flex-1 h-12 text-ios-subhead font-medium transition-all duration-200",
                "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]",
                "focus:bg-[#3C3C3E] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                isActive && "focus:border-blue-400 focus:ring-blue-400/20"
              )}
            />
            {unit !== 'custom' && (
              <span className="text-[#AEAEB2] text-ios-subhead min-w-12 font-medium">
                {unitConfig.label.split('(')[1]?.replace(')', '') || unit}
              </span>
            )}
            {customUnit && unit === 'custom' && (
              <span className="text-[#AEAEB2] text-ios-subhead min-w-12 font-medium">
                {customUnit}
              </span>
            )}
          </div>
          {value && (
            <div className="flex items-center text-green-400 text-ios-footnote">
              <Check className="w-3 h-3 mr-1" />
              Value recorded
            </div>
          )}
        </div>
      )

    default:
      // Fallback to simple number input
      return (
        <div className={cn("flex items-center space-x-3", className)}>
          <Input
            type="number"
            placeholder="0"
            value={currentValue}
            onChange={(e) => {
              const numValue = parseFloat(e.target.value) || 0
              handleValueChange(numValue)
            }}
            className={cn(
              "flex-1 h-12 text-center text-ios-subhead font-medium",
              "bg-[#4C4C4E] border-[#5C5C5E] text-white placeholder-[#AEAEB2]"
            )}
          />
          <span className="text-[#AEAEB2] text-ios-subhead min-w-12 font-medium">
            {unit}
          </span>
        </div>
      )
  }
} 