"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  GitFork,
  Star,
  Users,
  TrendingUp,
  Award,
  User,
  Edit3,
  Plus,
  Minus,
  Clock,
  Target,
} from "lucide-react"

interface ChangelogEntry {
  id: string
  type: "fork" | "edit" | "improvement" | "creation"
  title: string
  description: string
  author: string
  authorAvatar?: string
  timestamp: string
  ritualId: string
  ritualName: string
  changes?: {
    added?: string[]
    removed?: string[]
    modified?: string[]
  }
  metrics?: {
    adoptions: number
    rating: number
    forks: number
  }
  parentId?: string
  parentAuthor?: string
}

interface ChangelogScreenProps {
  onClose: () => void
  ritualId?: string
  showGlobal?: boolean
}

export function ChangelogScreen({ onClose, ritualId, showGlobal = false }: ChangelogScreenProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "forks" | "creators" | "rewards">("timeline")
  const [selectedRitual, setSelectedRitual] = useState<string | null>(ritualId || null)

  // Mock changelog data
  const mockChangelog: ChangelogEntry[] = [
    {
      id: "cl-1",
      type: "creation",
      title: "Created Morning Productivity Stack",
      description: "Initial creation of comprehensive morning routine for peak performance",
      author: "productivity_guru",
      authorAvatar: "PG",
      timestamp: "2024-01-15T08:00:00Z",
      ritualId: "ritual-1",
      ritualName: "Morning Productivity Stack",
      changes: {
        added: ["Make bed", "Drink water", "Daily intention", "Review calendar", "Meditation", "Healthy breakfast"],
      },
      metrics: {
        adoptions: 1247,
        rating: 4.8,
        forks: 156,
      },
    },
    {
      id: "cl-2",
      type: "fork",
      title: "Forked to Morning Routine for Students",
      description: "Adapted the productivity stack for college students with limited time",
      author: "student_life",
      authorAvatar: "SL",
      timestamp: "2024-01-18T09:30:00Z",
      ritualId: "ritual-2",
      ritualName: "Morning Routine for Students",
      parentId: "ritual-1",
      parentAuthor: "productivity_guru",
      changes: {
        added: ["Quick breakfast", "Pack backpack", "Check class schedule"],
        removed: ["Review calendar", "10 minutes meditation"],
        modified: ["Daily intention → Study goals for today"],
      },
      metrics: {
        adoptions: 423,
        rating: 4.6,
        forks: 67,
      },
    },
    {
      id: "cl-3",
      type: "improvement",
      title: "Enhanced with Mindfulness Elements",
      description: "Added breathing exercises and gratitude practice based on user feedback",
      author: "mindful_mornings",
      authorAvatar: "MM",
      timestamp: "2024-01-22T07:15:00Z",
      ritualId: "ritual-3",
      ritualName: "Mindful Morning Stack",
      parentId: "ritual-1",
      parentAuthor: "productivity_guru",
      changes: {
        added: ["3-minute breathing", "Gratitude journaling", "Intention setting"],
        modified: ["10 minutes meditation → 15 minutes mindfulness practice"],
      },
      metrics: {
        adoptions: 892,
        rating: 4.9,
        forks: 134,
      },
    },
    {
      id: "cl-4",
      type: "edit",
      title: "Optimized for Remote Workers",
      description: "Adjusted timing and added home office setup steps",
      author: "remote_pro",
      authorAvatar: "RP",
      timestamp: "2024-01-25T06:45:00Z",
      ritualId: "ritual-4",
      ritualName: "Remote Worker Morning Routine",
      parentId: "ritual-1",
      parentAuthor: "productivity_guru",
      changes: {
        added: ["Set up workspace", "Check internet connection", "Review daily standup notes"],
        modified: ["Review calendar → Check team calendar and meetings"],
      },
      metrics: {
        adoptions: 756,
        rating: 4.7,
        forks: 89,
      },
    },
    {
      id: "cl-5",
      type: "fork",
      title: "Athlete's Morning Protocol",
      description: "Specialized version for athletes with pre-training preparation",
      author: "fitness_coach",
      authorAvatar: "FC",
      timestamp: "2024-02-01T05:30:00Z",
      ritualId: "ritual-5",
      ritualName: "Athlete's Morning Protocol",
      parentId: "ritual-1",
      parentAuthor: "productivity_guru",
      changes: {
        added: ["Dynamic warm-up", "Protein shake", "Equipment check", "Training visualization"],
        removed: ["Healthy breakfast"],
        modified: ["10 minutes meditation → 5 minutes visualization"],
      },
      metrics: {
        adoptions: 634,
        rating: 4.8,
        forks: 78,
      },
    },
    {
      id: "cl-6",
      type: "improvement",
      title: "Added Time Tracking",
      description: "Integrated time estimates for each step to improve planning",
      author: "time_master",
      authorAvatar: "TM",
      timestamp: "2024-02-05T08:20:00Z",
      ritualId: "ritual-1",
      ritualName: "Morning Productivity Stack",
      changes: {
        modified: [
          "Make bed (2 min)",
          "Drink water (1 min)",
          "Daily intention (3 min)",
          "Review calendar (5 min)",
          "Meditation (10 min)",
          "Healthy breakfast (15 min)",
        ],
      },
      metrics: {
        adoptions: 1247,
        rating: 4.8,
        forks: 156,
      },
    },
  ]

  // Mock creator rewards data
  const creatorRewards = [
    {
      author: "productivity_guru",
      totalAdoptions: 3952,
      totalForks: 524,
      averageRating: 4.8,
      rewardPoints: 15808,
      rank: 1,
      badges: ["Pioneer", "Productivity Master", "Community Favorite"],
    },
    {
      author: "mindful_mornings",
      totalAdoptions: 2341,
      totalForks: 298,
      averageRating: 4.9,
      rewardPoints: 9364,
      rank: 2,
      badges: ["Mindfulness Expert", "High Quality", "User Favorite"],
    },
    {
      author: "fitness_coach",
      totalAdoptions: 1876,
      totalForks: 234,
      averageRating: 4.7,
      rewardPoints: 7504,
      rank: 3,
      badges: ["Fitness Guru", "Specialized Content"],
    },
    {
      author: "remote_pro",
      totalAdoptions: 1432,
      totalForks: 167,
      averageRating: 4.6,
      rewardPoints: 5728,
      rank: 4,
      badges: ["Remote Work Expert"],
    },
    {
      author: "student_life",
      totalAdoptions: 987,
      totalForks: 123,
      averageRating: 4.5,
      rewardPoints: 3948,
      rank: 5,
      badges: ["Student Helper"],
    },
  ]

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "creation":
        return <Plus className="w-4 h-4 text-green-400" />
      case "fork":
        return <GitFork className="w-4 h-4 text-blue-400" />
      case "improvement":
        return <TrendingUp className="w-4 h-4 text-purple-400" />
      case "edit":
        return <Edit3 className="w-4 h-4 text-orange-400" />
      default:
        return <Target className="w-4 h-4 text-gray-400" />
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case "creation":
        return "border-green-500/30 bg-green-500/10"
      case "fork":
        return "border-blue-500/30 bg-blue-500/10"
      case "improvement":
        return "border-purple-500/30 bg-purple-500/10"
      case "edit":
        return "border-orange-500/30 bg-orange-500/10"
      default:
        return "border-gray-500/30 bg-gray-500/10"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  const filteredChangelog = selectedRitual
    ? mockChangelog.filter((entry) => entry.ritualId === selectedRitual || entry.parentId === selectedRitual)
    : mockChangelog

  const renderTimeline = () => (
    <div className="space-y-4">
      {/* Ritual Filter */}
      {showGlobal && (
        <div className="ios-card p-4">
          <div className="text-white font-medium text-ios-subhead mb-3">Filter by Ritual</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRitual(null)}
              className={cn(
                "text-sm",
                !selectedRitual ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
              )}
            >
              All Rituals
            </Button>
            {Array.from(new Set(mockChangelog.map((entry) => entry.ritualId))).map((ritualId) => {
              const ritual = mockChangelog.find((entry) => entry.ritualId === ritualId)
              return (
                <Button
                  key={ritualId}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRitual(ritualId)}
                  className={cn(
                    "text-sm",
                    selectedRitual === ritualId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                  )}
                >
                  {ritual?.ritualName}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {filteredChangelog.map((entry, index) => (
          <div key={entry.id} className={cn("ios-card p-4 border", getChangeColor(entry.type))}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                  {entry.authorAvatar || entry.author.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getChangeIcon(entry.type)}
                    <span className="text-white font-medium text-ios-subhead">{entry.title}</span>
                  </div>
                  <div className="text-[#AEAEB2] text-ios-footnote">
                    by {entry.author} • {formatTimeAgo(entry.timestamp)}
                  </div>
                  {entry.parentAuthor && (
                    <div className="text-[#AEAEB2] text-ios-footnote">forked from {entry.parentAuthor}'s version</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-ios-footnote text-[#AEAEB2]">{entry.ritualName}</div>
                {entry.metrics && (
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-blue-400" />
                      <span className="text-ios-footnote text-blue-400">{entry.metrics.adoptions}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-ios-footnote text-yellow-400">{entry.metrics.rating}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-white text-ios-subhead mb-3">{entry.description}</p>

            {/* Changes */}
            {entry.changes && (
              <div className="space-y-2">
                {entry.changes.added && entry.changes.added.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Plus className="w-3 h-3 text-green-400" />
                      <span className="text-ios-footnote text-green-400 font-medium">Added</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {entry.changes.added.map((item, i) => (
                        <div key={i} className="text-ios-footnote text-[#AEAEB2]">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.changes.removed && entry.changes.removed.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Minus className="w-3 h-3 text-red-400" />
                      <span className="text-ios-footnote text-red-400 font-medium">Removed</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {entry.changes.removed.map((item, i) => (
                        <div key={i} className="text-ios-footnote text-[#AEAEB2]">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.changes.modified && entry.changes.modified.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Edit3 className="w-3 h-3 text-orange-400" />
                      <span className="text-ios-footnote text-orange-400 font-medium">Modified</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {entry.changes.modified.map((item, i) => (
                        <div key={i} className="text-ios-footnote text-[#AEAEB2]">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderForks = () => {
    const forkEntries = filteredChangelog.filter((entry) => entry.type === "fork" || entry.type === "improvement")

    return (
      <div className="space-y-4">
        <div className="ios-card p-4">
          <h3 className="text-white font-medium text-ios-subhead mb-3">Fork Network</h3>
          <div className="text-[#AEAEB2] text-ios-footnote">Showing {forkEntries.length} forks and improvements</div>
        </div>

        <div className="space-y-3">
          {forkEntries.map((entry) => (
            <div key={entry.id} className="ios-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                    {entry.authorAvatar || entry.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <GitFork className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium text-ios-subhead">{entry.ritualName}</span>
                    </div>
                    <div className="text-[#AEAEB2] text-ios-footnote">
                      by {entry.author} • {formatTimeAgo(entry.timestamp)}
                    </div>
                    {entry.parentAuthor && (
                      <div className="text-blue-400 text-ios-footnote">↳ forked from {entry.parentAuthor}</div>
                    )}
                  </div>
                </div>
                {entry.metrics && (
                  <div className="text-right">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span className="text-ios-footnote text-blue-400">{entry.metrics.adoptions}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitFork className="w-3 h-3 text-green-400" />
                        <span className="text-ios-footnote text-green-400">{entry.metrics.forks}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[#AEAEB2] text-ios-subhead">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderCreators = () => (
    <div className="space-y-4">
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Top Contributors</h3>
        <div className="text-[#AEAEB2] text-ios-footnote">Ranked by community impact and adoption</div>
      </div>

      <div className="space-y-3">
        {creatorRewards.map((creator, index) => (
          <div key={creator.author} className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {creator.author.slice(0, 2).toUpperCase()}
                  </div>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Award className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium text-ios-subhead">{creator.author}</div>
                  <div className="text-[#AEAEB2] text-ios-footnote">Rank #{creator.rank}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-ios-headline font-bold text-blue-400">{creator.rewardPoints}</div>
                <div className="text-ios-footnote text-[#AEAEB2]">points</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-ios-subhead font-bold text-white">{creator.totalAdoptions}</div>
                <div className="text-ios-footnote text-[#AEAEB2]">Adoptions</div>
              </div>
              <div className="text-center">
                <div className="text-ios-subhead font-bold text-white">{creator.totalForks}</div>
                <div className="text-ios-footnote text-[#AEAEB2]">Forks</div>
              </div>
              <div className="text-center">
                <div className="text-ios-subhead font-bold text-white">{creator.averageRating}</div>
                <div className="text-ios-footnote text-[#AEAEB2]">Rating</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {creator.badges.map((badge, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-ios-footnote rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRewards = () => (
    <div className="space-y-4">
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Reward System</h3>
        <div className="text-[#AEAEB2] text-ios-subhead mb-4">
          Creators earn points based on community adoption and feedback
        </div>

        {/* Point System */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-green-400" />
              <span className="text-white text-ios-subhead">Ritual Creation</span>
            </div>
            <span className="text-green-400 font-medium">+100 pts</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white text-ios-subhead">Per Adoption</span>
            </div>
            <span className="text-blue-400 font-medium">+4 pts</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitFork className="w-4 h-4 text-purple-400" />
              <span className="text-white text-ios-subhead">Per Fork</span>
            </div>
            <span className="text-purple-400 font-medium">+10 pts</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-ios-subhead">5-Star Rating</span>
            </div>
            <span className="text-yellow-400 font-medium">+20 pts</span>
          </div>
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Reward Tiers</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white font-medium">Gold Creator</div>
                <div className="text-[#AEAEB2] text-ios-footnote">10,000+ points</div>
              </div>
            </div>
            <div className="text-yellow-400 text-ios-footnote">Premium features</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-white font-medium">Silver Creator</div>
                <div className="text-[#AEAEB2] text-ios-footnote">5,000+ points</div>
              </div>
            </div>
            <div className="text-gray-400 text-ios-footnote">Special badges</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-white font-medium">Bronze Creator</div>
                <div className="text-[#AEAEB2] text-ios-footnote">1,000+ points</div>
              </div>
            </div>
            <div className="text-orange-400 text-ios-footnote">Recognition</div>
          </div>
        </div>
      </div>

      {/* Future Rewards */}
      <div className="ios-card p-4">
        <h3 className="text-white font-medium text-ios-subhead mb-3">Coming Soon</h3>
        <div className="space-y-2 text-[#AEAEB2] text-ios-subhead">
          <div>• Monetary rewards for top creators</div>
          <div>• Exclusive creator workshops</div>
          <div>• Early access to new features</div>
          <div>• Creator spotlight program</div>
          <div>• Community voting on rewards</div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "forks", label: "Forks", icon: GitFork },
    { id: "creators", label: "Creators", icon: User },
    { id: "rewards", label: "Rewards", icon: Award },
  ]

  return (
    <div className="fixed inset-0 bg-[#1C1C1E] z-50 flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-400 hover:text-blue-300 p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center flex-1">
          <div className="text-white font-medium text-ios-subhead">
            {showGlobal ? "Global Changelog" : "Ritual Evolution"}
          </div>
          <div className="text-[#AEAEB2] text-ios-footnote">Track changes and improvements</div>
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
          {activeTab === "timeline" && renderTimeline()}
          {activeTab === "forks" && renderForks()}
          {activeTab === "creators" && renderCreators()}
          {activeTab === "rewards" && renderRewards()}
        </div>
      </div>
    </div>
  )
}
