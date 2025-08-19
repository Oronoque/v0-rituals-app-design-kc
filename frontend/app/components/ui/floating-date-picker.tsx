"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  className?: string;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  className = "",
}: DatePickerProps) {
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);

  // Generate visible dates around the selected date
  useEffect(() => {
    const selected = new Date(selectedDate);
    const dates: Date[] = [];

    // Show 2 days before and 2 days after the selected date
    for (let i = -2; i <= 2; i++) {
      const date = new Date(selected);
      date.setDate(selected.getDate() + i);
      dates.push(date);
    }

    setVisibleDates(dates);
  }, [selectedDate]);

  const navigateDate = (direction: "prev" | "next") => {
    const selected = new Date(selectedDate);
    const newDate = new Date(selected);

    if (direction === "prev") {
      newDate.setDate(selected.getDate() - 1);
    } else {
      newDate.setDate(selected.getDate() + 1);
    }

    onDateChange(newDate.toISOString().split("T")[0]);
  };

  const selectDate = (date: Date) => {
    onDateChange(date.toISOString().split("T")[0]);
  };

  const getDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else {
      // Just show the day number for all other dates
      return date.getDate().toString();
    }
  };

  return (
    <div
      className={`p-2 bg-[#1C1C1E] flex items-center justify-center ${className}`}
    >
      <div className="flex items-center space-x-2 bg-[#2C2C2E] rounded-full px-3 py-2">
        {/* Previous Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDate("prev")}
          className="text-gray-400 hover:text-white p-1.5 rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Date Buttons */}
        <div className="flex items-center space-x-1">
          {visibleDates.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <Button
                key={dateStr}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => selectDate(date)}
                className={`
                  min-w-[2.5rem] h-8 px-2 text-xs rounded-full transition-all duration-200 font-medium
                  ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : isToday
                        ? "text-blue-400 hover:text-white hover:bg-blue-600/20 border border-blue-400/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }
                `}
              >
                {getDateLabel(date)}
              </Button>
            );
          })}
        </div>

        {/* Next Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDate("next")}
          className="text-gray-400 hover:text-white p-1.5 rounded-full"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
