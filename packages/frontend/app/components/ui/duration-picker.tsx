"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Clock, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface DurationPickerProps {
  value: number; // Duration in seconds
  onChange: (seconds: number) => void;
  showClock?: boolean;
  showArrow?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
}

interface TimeUnits {
  hours: number;
  minutes: number;
  seconds: number;
}

// Quick preset durations (in seconds)
const QUICK_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
  { label: "15m", seconds: 900 },
  { label: "20m", seconds: 1200 },
  { label: "30m", seconds: 1800 },
];

export function DurationPicker({
  value,
  onChange,
  className,
  showClock = true,
  showArrow = true,
  placeholder = "Select duration",
  label = "Duration",
}: DurationPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Convert seconds to time units
  const secondsToTimeUnits = (totalSeconds: number): TimeUnits => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  // Convert time units to seconds
  const timeUnitsToSeconds = (units: TimeUnits): number => {
    return units.hours * 3600 + units.minutes * 60 + units.seconds;
  };

  const [timeUnits, setTimeUnits] = useState<TimeUnits>(() =>
    secondsToTimeUnits(value)
  );

  // Update time units when value changes externally
  const updateTimeUnits = (newUnits: Partial<TimeUnits>) => {
    const updatedUnits = { ...timeUnits, ...newUnits };
    setTimeUnits(updatedUnits);
    onChange(timeUnitsToSeconds(updatedUnits));
  };

  // Handle preset selection
  const handlePresetSelect = (seconds: number) => {
    const newUnits = secondsToTimeUnits(seconds);
    setTimeUnits(newUnits);
    onChange(seconds);
    setIsModalOpen(false);
  };

  // Handle apply button
  const handleApply = () => {
    setIsModalOpen(false);
  };

  // Format duration for display
  const formatDuration = (totalSeconds: number): string => {
    const units = secondsToTimeUnits(totalSeconds);
    const parts: string[] = [];

    if (units.hours > 0) parts.push(`${units.hours}h`);
    if (units.minutes > 0) parts.push(`${units.minutes}m`);
    if (units.seconds > 0) parts.push(`${units.seconds}s`);

    return parts.length > 0 ? parts.join(" ") : "0s";
  };

  // Increment/decrement functions
  const adjustValue = (unit: keyof TimeUnits, delta: number) => {
    const newValue = Math.max(0, timeUnits[unit] + delta);
    const maxValues = { hours: 23, minutes: 59, seconds: 59 };

    updateTimeUnits({
      [unit]: Math.min(newValue, maxValues[unit]),
    });
  };

  return (
    <>
      {/* Duration Picker Button */}
      <div className={cn("space-y-2", className)}>
        <Label className="text-white text-ios-headline">{label}</Label>
        <Button
          variant="outline"
          className="w-full justify-between border-[#3C3C3E] bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white ios-touch-target"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center space-x-2">
            {showClock && <Clock className="h-4 w-4" />}
            <span>{value > 0 ? formatDuration(value) : placeholder}</span>
          </div>
          {showArrow && <span className="text-[#AEAEB2]">→</span>}
        </Button>
      </div>

      {/* Duration Selection Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 rounded-t-xl mx-2 mb-2 max-h-[85vh] flex flex-col ios-scroll-container border-0 bg-[#1C1C1E] z-50">
            <div className="flex-shrink-0 p-6 pb-4 border-b border-[#3C3C3E]">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-ios-headline">Select {label}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 p-0 text-[#AEAEB2] hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Quick Presets */}
              <div className="space-y-3">
                <Label className="text-white text-ios-subheadline">
                  Quick Select
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_PRESETS.map((preset) => (
                    <Button
                      key={preset.seconds}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-[#3C3C3E] hover:bg-[#3C3C3E] transition-colors text-ios-footnote ios-touch-target",
                        value === preset.seconds
                          ? "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white"
                          : "text-white"
                      )}
                      onClick={() => handlePresetSelect(preset.seconds)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Duration Controls */}
              <div className="space-y-4">
                <Label className="text-white text-ios-subheadline">
                  Custom Duration
                </Label>

                {/* Time Unit Controls */}
                <div className="space-y-3">
                  {/* Hours */}
                  <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-lg">
                    <span className="text-white text-ios-body">Hours</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("hours", -1)}
                        disabled={timeUnits.hours === 0}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-14 text-center">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={timeUnits.hours}
                          onChange={(e) =>
                            updateTimeUnits({
                              hours: Math.max(
                                0,
                                Math.min(23, parseInt(e.target.value) || 0)
                              ),
                            })
                          }
                          className="bg-transparent border-none text-center text-white text-ios-body p-0 h-7"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("hours", 1)}
                        disabled={timeUnits.hours === 23}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-lg">
                    <span className="text-white text-ios-body">Minutes</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("minutes", -1)}
                        disabled={timeUnits.minutes === 0}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-14 text-center">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={timeUnits.minutes}
                          onChange={(e) =>
                            updateTimeUnits({
                              minutes: Math.max(
                                0,
                                Math.min(59, parseInt(e.target.value) || 0)
                              ),
                            })
                          }
                          className="bg-transparent border-none text-center text-white text-ios-body p-0 h-7"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("minutes", 1)}
                        disabled={timeUnits.minutes === 59}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Seconds */}
                  <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-lg">
                    <span className="text-white text-ios-body">Seconds</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("seconds", -1)}
                        disabled={timeUnits.seconds === 0}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-14 text-center">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={timeUnits.seconds}
                          onChange={(e) =>
                            updateTimeUnits({
                              seconds: Math.max(
                                0,
                                Math.min(59, parseInt(e.target.value) || 0)
                              ),
                            })
                          }
                          className="bg-transparent border-none text-center text-white text-ios-body p-0 h-7"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustValue("seconds", 1)}
                        disabled={timeUnits.seconds === 59}
                        className="h-9 w-9 p-0 text-[#AEAEB2] hover:text-white ios-touch-target"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Total Duration Display */}
                <div className="text-center p-4 bg-[#3C3C3E]/50 rounded-lg">
                  <div className="text-[#AEAEB2] text-ios-footnote mb-1">
                    Total Duration
                  </div>
                  <div className="text-white text-ios-headline font-medium">
                    {formatDuration(value)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-[#3C3C3E]">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#3C3C3E] text-white hover:bg-[#3C3C3E] ios-touch-target"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white ios-touch-target"
                  onClick={handleApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
