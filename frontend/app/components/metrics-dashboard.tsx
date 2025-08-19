"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MetricsChart } from "./metrics-chart"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Award, Target, Calendar, BarChart3, X } from "lucide-react"

interface MetricsSummary {
  totalCompletions: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  averageScore?: number
  personalBest?: number
  trend: "up" | "down" | "stable"
  trendPercentage: number
}

interface MetricsData {
  summary: MetricsSummary
  completionHistory: Array<{ date: string; value: number }>
  answerHistory?: Array<{ date: string; answer: string }>
  fitnessHistory?: {
    volume: Array<{ date: string; value: number }>
    maxWeight: Array<{ date: string; value: number }>
    oneRepMax: Array<{ date: string; value: number }>
    personalRecords: Array<{ date: string; reps: number; weight: number }>
  }
  customHistory?: Array<{ date: string; value: number; unit: string }>
}

interface MetricsDashboardProps {
  title: string
  type: "ritual" | "yesno" | "qa" | "weightlifting" | "cardio" | "custom"
  data: MetricsData
  onClose: () => void
}

export function MetricsDashboard({ title, type, data, onClose }: MetricsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "history" | "records">("overview")

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card p-4 text-center">
          <div className="text-ios-title-2 font-bold text-blue-400">{data.summary.totalCompletions}</div>
          <div className="text-ios-footnote text-[#AEAEB2]">Total Completions</div>
        </div>
        <div className="ios-card p-4 text-center">
          <div className="text-ios-title-2 font-bold text-green-400">{data.summary.completionRate}%</div>
          <div className="text-ios-footnote text-[#AEAEB2]">Success Rate</div>
        </div>
        <div className="ios-card p-4 text-center">
          <div className="text-ios-title-2 font-bold text-orange-400">{data.summary.currentStreak}</div>
          <div className="text-ios-footnote text-[#AEAEB2]">Current Streak</div>
        </div>
        <div className="ios-card p-4 text-center">
          <div className="text-ios-title-2 font-bold text-purple-400">{data.summary.longestStreak}</div>
          <div className="text-ios-footnote text-[#AEAEB2]">Best Streak</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="ios-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-ios-subhead">Recent Trend</div>
            <div className="text-[#AEAEB2] text-ios-footnote">Last 7 days vs previous 7 days</div>
          </div>
          <div className="flex items-center space-x-2">
            {data.summary.trend === "up" ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : data.summary.trend === "down" ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <div className="w-5 h-5 bg-gray-400 rounded-full" />
            )}
            <span
              className={cn(
                "text-ios-subhead font-medium",
                data.summary.trend === "up"
                  ? "text-green-400"
                  : data.summary.trend === "down"
                    ? "text-red-400"
                    : "text-gray-400",
              )}
            >
              {data.summary.trendPercentage > 0 ? "+" : ""}
              {data.summary.trendPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Personal Best (for fitness) */}
      {type === "weightlifting" && data.summary.personalBest && (
        <div className="ios-card p-4">
          <div className="flex items-center space-x-3">
            <Award className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="text-white font-medium text-ios-subhead">Personal Best</div>
              <div className="text-yellow-400 text-ios-body font-bold">{data.summary.personalBest} lbs</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Performance */}
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Recent Performance</h3>
        <div className="space-y-2">
          {data.completionHistory.slice(-7).map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="text-ios-footnote text-[#AEAEB2]">
                {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className={cn("text-ios-footnote font-medium", entry.value > 0 ? "text-green-400" : "text-red-400")}>
                {entry.value > 0 ? "✓" : "✗"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTrends = () => (
    <div className="space-y-4">
      <MetricsChart
        data={data.completionHistory}
        title="Completion Rate Over Time"
        type="area"
        color="blue"
        unit="%"
        height={180}
      />

      {type === "weightlifting" && data.fitnessHistory && (
        <>
          <MetricsChart
            data={data.fitnessHistory.volume}
            title="Training Volume"
            type="bar"
            color="green"
            unit=" lbs"
            height={160}
          />
          <MetricsChart
            data={data.fitnessHistory.oneRepMax}
            title="Estimated 1RM Progress"
            type="line"
            color="purple"
            unit=" lbs"
            height={160}
          />
        </>
      )}

      {type === "cardio" && data.fitnessHistory && (
        <MetricsChart
          data={data.fitnessHistory.volume}
          title="Distance Over Time"
          type="area"
          color="orange"
          unit=" mi"
          height={160}
        />
      )}

      {type === "custom" && data.customHistory && (
        <MetricsChart
          data={data.customHistory}
          title="Progress Over Time"
          type="line"
          color="blue"
          unit={data.customHistory[0]?.unit || ""}
          height={180}
        />
      )}
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-3">
      {type === "qa" && data.answerHistory
        ? data.answerHistory
            .slice(-10)
            .reverse()
            .map((entry, index) => (
              <div key={index} className="ios-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-ios-footnote text-[#AEAEB2]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-white text-ios-subhead">{entry.answer}</div>
              </div>
            ))
        : data.completionHistory
            .slice(-15)
            .reverse()
            .map((entry, index) => (
              <div key={index} className="ios-card p-3">
                <div className="flex justify-between items-center">
                  <div className="text-ios-footnote text-[#AEAEB2]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div
                    className={cn("text-ios-subhead font-medium", entry.value > 0 ? "text-green-400" : "text-red-400")}
                  >
                    {entry.value > 0 ? "✓ Completed" : "✗ Missed"}
                  </div>
                </div>
              </div>
            ))}
    </div>
  )

  const renderRecords = () => (
    <div className="space-y-4">
      {type === "weightlifting" && data.fitnessHistory?.personalRecords && (
        <>
          <div className="ios-card p-4">
            <h3 className="text-white font-medium text-ios-subhead mb-3">Personal Records</h3>
            <div className="space-y-3">
              {data.fitnessHistory.personalRecords.slice(-5).map((record, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-white text-ios-subhead">
                      {record.reps} reps @ {record.weight} lbs
                    </div>
                    <div className="text-[#AEAEB2] text-ios-footnote">{new Date(record.date).toLocaleDateString()}</div>
                  </div>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="ios-card p-4">
            <h3 className="text-white font-medium text-ios-subhead mb-3">Rep Maxes</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-ios-headline font-bold text-blue-400">
                  {data.fitnessHistory.oneRepMax[data.fitnessHistory.oneRepMax.length - 1]?.value || 0}
                </div>
                <div className="text-ios-footnote text-[#AEAEB2]">1RM</div>
              </div>
              <div className="text-center">
                <div className="text-ios-headline font-bold text-green-400">
                  {Math.round(
                    (data.fitnessHistory.oneRepMax[data.fitnessHistory.oneRepMax.length - 1]?.value || 0) * 0.9,
                  )}
                </div>
                <div className="text-ios-footnote text-[#AEAEB2]">3RM</div>
              </div>
              <div className="text-center">
                <div className="text-ios-headline font-bold text-purple-400">
                  {Math.round(
                    (data.fitnessHistory.oneRepMax[data.fitnessHistory.oneRepMax.length - 1]?.value || 0) * 0.8,
                  )}
                </div>
                <div className="text-ios-footnote text-[#AEAEB2]">5RM</div>
              </div>
            </div>
          </div>
        </>
      )}

      {type === "ritual" && (
        <div className="ios-card p-4">
          <h3 className="text-white font-medium text-ios-subhead mb-3">Achievements</h3>
          <div className="space-y-3">
            {data.summary.currentStreak >= 7 && (
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-white text-ios-subhead">Consistency Master</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">7+ day streak achieved</div>
                </div>
              </div>
            )}
            {data.summary.completionRate >= 90 && (
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-white text-ios-subhead">Excellence</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">90%+ completion rate</div>
                </div>
              </div>
            )}
            {data.summary.totalCompletions >= 30 && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white text-ios-subhead">Dedicated</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">30+ completions</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(type === "yesno" || type === "qa") && (
        <div className="ios-card p-4">
          <h3 className="text-white font-medium text-ios-subhead mb-3">Milestones</h3>
          <div className="space-y-3">
            {data.summary.longestStreak >= 14 && (
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-white text-ios-subhead">Two Week Warrior</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">14+ day streak</div>
                </div>
              </div>
            )}
            {data.summary.completionRate >= 80 && (
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-white text-ios-subhead">High Achiever</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">80%+ success rate</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "history", label: "History", icon: Calendar },
    ...(type === "weightlifting" || type === "ritual" ? [{ id: "records", label: "Records", icon: Award }] : []),
  ]

  return (
    <div className="fixed inset-0 bg-[#1C1C1E] z-50 flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-400 hover:text-blue-300 p-2">
          <X className="w-5 h-5" />
        </Button>
        <div className="text-center flex-1">
          <div className="text-white font-medium text-ios-subhead">{title}</div>
          <div className="text-[#AEAEB2] text-ios-footnote">Analytics & Progress</div>
        </div>
        <div className="w-12" />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 h-12 rounded-none border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-[#AEAEB2] hover:text-white",
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "trends" && renderTrends()}
          {activeTab === "history" && renderHistory()}
          {activeTab === "records" && renderRecords()}
        </div>
      </div>
    </div>
  )
}
