"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Star, Clock, Users, Plus } from "lucide-react"
import { BottomNavigation } from "@/app/components/ui/bottom-navigation"
import type { FlowState, Ritual } from "@/app/types"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

// Mock library rituals
const libraryRituals: Ritual[] = [
  {
    id: "lib-1",
    name: "5-Minute Morning Energizer",
    description: "Quick morning routine to boost energy and focus",
    category: "Wellness",
    author: "wellness_guru",
    rating: 4.8,
    users: 2341,
    tags: ["Quick", "Energy", "Beginner"],
    scheduledTime: "06:00",
    completed: false,
    wasModified: false,
    steps: [
      {
        id: "lib-1-step-1",
        name: "Deep Breathing",
        type: "yesno",
        question: "Take 10 deep breaths, focusing on your breath",
        completed: false,
      },
      {
        id: "lib-1-step-2",
        name: "Stretching",
        type: "yesno",
        question: "Stretch your arms, legs, and back for 1 minute",
        completed: false,
      },
      {
        id: "lib-1-step-3",
        name: "Positive Affirmation",
        type: "qa",
        question: "Write down one positive affirmation for today",
        completed: false,
      },
      {
        id: "lib-1-step-4",
        name: "Cold Water",
        type: "yesno",
        question: "Splash cold water on your face",
        completed: false,
      },
    ],
  },
  {
    id: "lib-2",
    name: "Power Lifter's Protocol",
    description: "Strength training routine for intermediate lifters",
    category: "Fitness",
    author: "strength_coach",
    rating: 4.9,
    users: 1876,
    tags: ["Strength", "Advanced", "Powerlifting"],
    scheduledTime: "07:00",
    completed: false,
    wasModified: false,
    steps: [
      {
        id: "lib-2-step-1",
        name: "Warm-up",
        type: "yesno",
        question: "5 minutes of dynamic stretching and mobility work",
        completed: false,
      },
      {
        id: "lib-2-step-2",
        name: "Squats",
        type: "weightlifting",
        question: "Barbell squats - focus on form",
        completed: false,
        weightliftingConfig: [
          { reps: 5, weight: 135, completed: false },
          { reps: 5, weight: 185, completed: false },
          { reps: 5, weight: 225, completed: false },
        ],
      },
      {
        id: "lib-2-step-3",
        name: "Cool Down",
        type: "yesno",
        question: "5 minutes of static stretching",
        completed: false,
      },
    ],
  },
  {
    id: "lib-3",
    name: "Mindful Evening Wind-Down",
    description: "Relaxing evening routine for better sleep",
    category: "Wellness",
    author: "mindfulness_master",
    rating: 4.7,
    users: 3421,
    tags: ["Relaxation", "Sleep", "Mindfulness"],
    scheduledTime: "21:00",
    completed: false,
    wasModified: false,
    steps: [
      {
        id: "lib-3-step-1",
        name: "Digital Sunset",
        type: "yesno",
        question: "Turn off all screens and digital devices",
        completed: false,
      },
      {
        id: "lib-3-step-2",
        name: "Gratitude Journal",
        type: "qa",
        question: "Write down three things you're grateful for today",
        completed: false,
      },
      {
        id: "lib-3-step-3",
        name: "Breathing Exercise",
        type: "yesno",
        question: "Practice 4-7-8 breathing technique for 2 minutes",
        completed: false,
      },
      {
        id: "lib-3-step-4",
        name: "Body Scan Meditation",
        type: "yesno",
        question: "Perform a 5-minute body scan meditation while lying in bed",
        completed: false,
      },
    ],
  },
  {
    id: "lib-4",
    name: "Student Study Ritual",
    description: "Focused study routine with breaks for optimal learning",
    category: "Productivity",
    author: "study_pro",
    rating: 4.6,
    users: 987,
    tags: ["Focus", "Study", "Productivity"],
    scheduledTime: "",
    completed: false,
    wasModified: false,
    steps: [
      {
        id: "lib-4-step-1",
        name: "Environment Setup",
        type: "yesno",
        question: "Clear desk, gather materials, fill water bottle",
        completed: false,
      },
      {
        id: "lib-4-step-2",
        name: "Goal Setting",
        type: "qa",
        question: "Write down 3 specific goals for this study session",
        completed: false,
      },
      {
        id: "lib-4-step-3",
        name: "Pomodoro Study Block",
        type: "yesno",
        question: "25 minutes of focused study, no distractions",
        completed: false,
      },
      {
        id: "lib-4-step-4",
        name: "Review & Reflect",
        type: "qa",
        question: "Summarize what you learned and note any questions",
        completed: false,
      },
    ],
  },
]

interface LibraryScreenProps {
  onNavigate: (flow: FlowState) => void
  onSelectRitual?: (ritual: Ritual) => void
  showBackButton?: boolean
  backDestination?: FlowState
}

export function LibraryScreen({
  onNavigate,
  onSelectRitual,
  showBackButton = false,
  backDestination = "home",
}: LibraryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [filteredRituals, setFilteredRituals] = useState<Ritual[]>(libraryRituals)

  // Filter rituals based on search query and selected category
  useEffect(() => {
    let filtered = libraryRituals

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ritual) =>
          ritual.name.toLowerCase().includes(query) ||
          ritual.description.toLowerCase().includes(query) ||
          ritual.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by category
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((ritual) => ritual.category === selectedCategory)
    }

    setFilteredRituals(filtered)
  }, [searchQuery, selectedCategory])

  const categories = ["All Categories", "Wellness", "Fitness", "Productivity"]

  const handleAddRitual = (ritual: Ritual) => {
    if (onSelectRitual) {
      // Create a deep copy of the ritual with a new ID to avoid conflicts
      const newRitual: Ritual = {
        ...ritual,
        id: uuidv4(), // Generate a new unique ID
        completed: false,
        wasModified: false,
        steps: ritual.steps.map((step) => ({
          ...step,
          id: uuidv4(), // Generate new IDs for steps too
          completed: false,
          answer: undefined,
          wasModified: false,
        })),
      }

      onSelectRitual(newRitual)

      // Navigate back if in selection mode
      if (showBackButton && backDestination) {
        onNavigate(backDestination)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(backDestination)}
            className="text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-8" />
        )}
        <div className="text-center">
          <div className="text-white font-medium text-ios-title-3">Library</div>
        </div>
        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#AEAEB2] w-4 h-4" />
          <Input
            type="text"
            placeholder="Search rituals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#AEAEB2] focus:border-blue-500 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-4 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full whitespace-nowrap",
                selectedCategory === category
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-[#2C2C2E] text-[#AEAEB2] hover:bg-[#3C3C3E] hover:text-white",
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Rituals List */}
      <div className="flex-1 px-4 pb-20 overflow-y-auto ios-scroll-container">
        {filteredRituals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#AEAEB2]" />
              </div>
              <h3 className="text-white font-medium text-ios-subhead mb-2">No Rituals Found</h3>
              <p className="text-[#AEAEB2] text-ios-body mb-6">Try a different search term or category</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRituals.map((ritual) => (
              <div
                key={ritual.id}
                className="ios-card p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 mb-1">
                      <h3 className="text-white font-medium text-ios-subhead">{ritual.name}</h3>
                      <div className="flex items-center text-yellow-400 ml-2">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-ios-footnote ml-1">{ritual.rating}</span>
                      </div>
                    </div>
                    <p className="text-[#AEAEB2] text-ios-footnote mb-2">{ritual.description}</p>
                    <div className="flex items-center text-[#AEAEB2] text-ios-caption-1 mb-2">
                      <span>by {ritual.author}</span>
                      <span className="mx-2">•</span>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {ritual.users.toLocaleString()}
                      </div>
                      <span className="mx-2">•</span>
                      <span>{ritual.steps.length} steps</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ritual.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-ios-caption-1 px-2 py-0.5 rounded-full bg-[#3C3C3E] text-[#AEAEB2]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-[#AEAEB2] text-ios-caption-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {ritual.scheduledTime || "Flexible"}
                      <span className="mx-2">•</span>
                      <span>{ritual.category}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddRitual(ritual)}
                    className="ml-4 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation currentFlow="library" onNavigate={onNavigate} />
    </div>
  )
}
