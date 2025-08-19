"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, TrendingUp, Users, Award, Flame } from "lucide-react"
import type { FlowState } from "@/app/types"
import { cn } from "@/lib/utils"

interface ProofUser {
  id: string
  name: string
  avatar: string
  proofScore: number
  currentStreak: number
  totalDays: number
  joinDate: string
  isCurrentUser?: boolean
}

interface ProofLeaderboardScreenProps {
  onNavigate: (flow: FlowState) => void
  currentUserStreak: number
  currentUserScore: number
  onContinue: () => void
}

export function ProofLeaderboardScreen({
  onNavigate,
  currentUserStreak,
  currentUserScore,
  onContinue,
}: ProofLeaderboardScreenProps) {
  const [selectedGroup, setSelectedGroup] = useState<number>(currentUserStreak)

  // Mock leaderboard data - in real app this would come from API
  const generateMockUsers = (streak: number): ProofUser[] => {
    const users: ProofUser[] = [
      {
        id: "current-user",
        name: "You",
        avatar: "JD",
        proofScore: currentUserScore,
        currentStreak: currentUserStreak,
        totalDays: 45,
        joinDate: "2024-01-01",
        isCurrentUser: true,
      },
    ]

    // Generate other users in the same proof group
    const baseNames = [
      "Alex Chen",
      "Sarah Kim",
      "Marcus Johnson",
      "Elena Rodriguez",
      "David Park",
      "Maya Patel",
      "James Wilson",
      "Lisa Zhang",
      "Ryan O'Connor",
      "Zoe Adams",
    ]

    for (let i = 0; i < 9; i++) {
      const daysOnApp = Math.floor(Math.random() * 200) + streak
      const missedDays = Math.floor(Math.random() * 10)
      const completedDays = daysOnApp - missedDays

      // Calculate proof score: start at 1, +1% for each completed day, -1% for each missed day
      let score = 1
      for (let j = 0; j < completedDays; j++) {
        score *= 1.01
      }
      for (let j = 0; j < missedDays; j++) {
        score *= 0.99
      }

      users.push({
        id: `user-${i}`,
        name: baseNames[i],
        avatar: baseNames[i]
          .split(" ")
          .map((n) => n[0])
          .join(""),
        proofScore: Math.round(score * 100) / 100,
        currentStreak: streak,
        totalDays: daysOnApp,
        joinDate: new Date(Date.now() - daysOnApp * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })
    }

    // Sort by proof score descending
    return users.sort((a, b) => b.proofScore - a.proofScore)
  }

  const currentGroupUsers = generateMockUsers(selectedGroup)
  const currentUserRank = currentGroupUsers.findIndex((user) => user.isCurrentUser) + 1

  // Generate available proof groups (streaks)
  const availableGroups = Array.from({ length: Math.min(50, currentUserStreak + 10) }, (_, i) => i + 1)
    .filter((group) => group <= currentUserStreak + 5) // Show current group and a few above
    .reverse()

  const getScoreColor = (score: number) => {
    if (score >= 2.0) return "text-purple-400"
    if (score >= 1.5) return "text-blue-400"
    if (score >= 1.2) return "text-green-400"
    if (score >= 1.1) return "text-yellow-400"
    return "text-[#AEAEB2]"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 2.0) return { label: "Legend", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
    if (score >= 1.5) return { label: "Master", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    if (score >= 1.2) return { label: "Expert", color: "bg-green-500/20 text-green-400 border-green-500/30" }
    if (score >= 1.1) return { label: "Skilled", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    return { label: "Rising", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" }
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("schedule")}
          className="text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="text-white font-medium text-ios-subhead">Proof Score Leaderboard</div>
          <div className="text-[#AEAEB2] text-ios-footnote">Consistency breeds excellence</div>
        </div>
        <div className="w-12" />
      </div>

      {/* Current User Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="ios-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-ios-subhead font-bold text-white">JD</span>
              </div>
              <div>
                <div className="text-white font-bold text-ios-subhead">Your Proof Score</div>
                <div className="text-[#AEAEB2] text-ios-footnote">
                  Rank #{currentUserRank} in Group {currentUserStreak}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("text-ios-title-2 font-bold", getScoreColor(currentUserScore))}>
                {currentUserScore.toFixed(2)}
              </div>
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-ios-caption-1 border",
                  getScoreBadge(currentUserScore).color,
                )}
              >
                {getScoreBadge(currentUserScore).label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-ios-headline font-bold text-orange-400">{currentUserStreak}</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-ios-headline font-bold text-green-400">+1%</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Daily Gain</div>
            </div>
            <div className="text-center">
              <div className="text-ios-headline font-bold text-blue-400">45</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Total Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Group Selector */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Proof Groups</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {availableGroups.map((group) => (
            <Button
              key={group}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full transition-colors flex items-center space-x-2",
                selectedGroup === group
                  ? "bg-blue-500 text-white"
                  : group === currentUserStreak
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-[#2C2C2E] text-[#AEAEB2] hover:text-white hover:bg-[#3C3C3E]",
              )}
            >
              <Flame className="w-3 h-3" />
              <span>Group {group}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-ios-title-3">Proof Group {selectedGroup}</h3>
            <div className="flex items-center space-x-2 text-[#AEAEB2] text-ios-footnote">
              <Users className="w-4 h-4" />
              <span>{currentGroupUsers.length} members</span>
            </div>
          </div>

          <div className="space-y-3">
            {currentGroupUsers.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "ios-card p-4 transition-all duration-200",
                  user.isCurrentUser && "border-blue-500/50 bg-blue-500/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-ios-footnote font-bold text-white">{user.avatar}</span>
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          {index === 0 ? (
                            <Trophy className="w-3 h-3 text-black" />
                          ) : (
                            <Award className="w-3 h-3 text-black" />
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={cn(
                            "font-medium text-ios-subhead",
                            user.isCurrentUser ? "text-blue-400" : "text-white",
                          )}
                        >
                          {user.name}
                        </span>
                        {user.isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-ios-caption-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[#AEAEB2] text-ios-footnote">
                        {user.totalDays} days on app • Joined {new Date(user.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#AEAEB2] text-ios-footnote">#{index + 1}</span>
                      <div className={cn("text-ios-headline font-bold", getScoreColor(user.proofScore))}>
                        {user.proofScore.toFixed(2)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "px-2 py-1 rounded-full text-ios-caption-1 border mt-1",
                        getScoreBadge(user.proofScore).color,
                      )}
                    >
                      {getScoreBadge(user.proofScore).label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How Proof Score Works */}
      <div className="p-4 border-t border-gray-700">
        <div className="ios-card p-4 mb-4">
          <h3 className="text-white font-medium text-ios-subhead mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
            How Proof Score Works
          </h3>
          <div className="space-y-2 text-ios-footnote text-[#AEAEB2]">
            <div>• Everyone starts with a score of 1.00</div>
            <div>• Complete your dayflow: +1% to your score</div>
            <div>• Miss a day: -1% from your score</div>
            <div>• Miss a day: Reset to Proof Group 1</div>
            <div>• Consistency over time builds the highest scores</div>
          </div>
        </div>

        <Button onClick={onContinue} className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12">
          Continue to Reflection
        </Button>
      </div>
    </div>
  )
}
