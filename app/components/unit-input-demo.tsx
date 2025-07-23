"use client"

import { useState } from "react"
import { UnitInput } from "@/app/components/ui/unit-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const demoUnits = [
  // Number inputs
  { unitValue: "count", label: "Morning pushups", value: "20", stepName: "Morning pushups" },
  { unitValue: "duration_minutes", label: "Meditation session", value: "15", stepName: "Meditation session" },
  { unitValue: "percentage", label: "Phone battery level", value: "85", stepName: "Check phone battery" },
  
  // Range inputs
  { unitValue: "mood", label: "Rate your mood", value: "4", stepName: "Rate your mood" },
  { unitValue: "energy_level", label: "Energy check", value: "3", stepName: "Rate energy level" },
  { unitValue: "pain_level", label: "Back pain assessment", value: "2", stepName: "Rate back pain" },
  { unitValue: "yes_no", label: "Drink enough water?", value: "1", stepName: "Hydration check" },
  
  // Time input
  { unitValue: "time_of_day", label: "Wake up time", value: "07:30", stepName: "Record wake up time" },
  
  // Blood pressure input
  { unitValue: "blood_pressure", label: "Blood pressure reading", value: "120/80", stepName: "Take blood pressure" },
  
  // Text input
  { unitValue: "dosage", label: "Vitamin dosage", value: "1000mg Vitamin D", stepName: "Take vitamins" },
]

export function UnitInputDemo() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(demoUnits.map(unit => [unit.unitValue, unit.value]))
  )

  const handleValueChange = (unitValue: string, newValue: string) => {
    setValues(prev => ({ ...prev, [unitValue]: newValue }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Unit Input Demo</h1>
        <p className="text-gray-600">
          Different input types based on unit categories
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {demoUnits.map((unit) => (
          <Card key={unit.unitValue} className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white">{unit.stepName}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {unit.unitValue}
                </Badge>
              </div>
              <CardDescription className="text-gray-400 text-xs">
                {unit.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <UnitInput
                unitValue={unit.unitValue}
                value={values[unit.unitValue] || ""}
                onChange={(value) => handleValueChange(unit.unitValue, value)}
                className="bg-[#3C3C3E] border-[#4C4C4E] text-white"
              />
              <div className="text-xs text-gray-400 font-mono bg-[#1C1C1E] p-2 rounded">
                Value: "{values[unit.unitValue] || ""}"
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
        <CardHeader>
          <CardTitle className="text-white">All Values</CardTitle>
          <CardDescription className="text-gray-400">
            Current state of all inputs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-gray-300 bg-[#1C1C1E] p-4 rounded overflow-auto">
            {JSON.stringify(values, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
} 