"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Types
import type { AppState, FlowState, Ritual } from "@/app/types"
import type { Step } from "@/app/types"

// Data
import { createMockRituals } from "@/app/data/mock-rituals"

// Utils
import { generateRitualMetricsData } from "@/app/utils/metrics"

// Screens
import { AuthScreen } from "@/app/screens/auth-screen"
import { HomeScreen } from "@/app/screens/home-screen"
import { LibraryScreen } from "@/app/screens/library-screen"
import { JournalScreen } from "@/app/screens/journal-screen"
import { SocialScreen } from "@/app/screens/social-screen"
import { DayFlowScreen } from "@/app/screens/dayflow-screen"
import { ReviewScreen } from "@/app/screens/review-screen"
import { ScheduleScreen } from "@/app/screens/schedule-screen"
import { ProofLeaderboardScreen } from "@/app/screens/proof-leaderboard-screen"
import { ReflectionScreen } from "@/app/screens/reflection-screen"

// Components
import { MetricsDashboard } from "@/app/components/metrics-dashboard"
import { ChangelogScreen } from "@/app/components/changelog-screen"

export default function RitualsApp() {
  const [appState, setAppState] = useState<AppState>({
    flowState: "auth",
    isAuthenticated: false,
    rituals: createMockRituals(),
    currentRitualIndex: 0,
    currentStepIndex: 0,
    showMetrics: false,
    selectedMetrics: null,
    showChangelog: false,
    changelogRitualId: null,
    showGlobalChangelog: false,
    completedRituals: [],
    currentStreak: 37, // Mock current streak
    proofScore: 1.45, // Mock proof score
    dayRating: 0,
    dayReflection: "",
  })

  // Track if we're in library selection mode for scheduling
  const [isLibraryForScheduling, setIsLibraryForScheduling] = useState(false)

  // Navigation handlers
  const handleAuthenticate = () => {
    setAppState((prev) => ({
      ...prev,
      isAuthenticated: true,
      flowState: "home",
    }))
  }

  const handleNavigate = (flow: FlowState) => {
    setAppState((prev) => ({ ...prev, flowState: flow }))
    // Reset library scheduling mode when navigating away
    if (flow !== "library") {
      setIsLibraryForScheduling(false)
    }
  }

  const handleStartRitual = (ritualIndex: number) => {
    setAppState((prev) => ({
      ...prev,
      currentRitualIndex: ritualIndex,
      currentStepIndex: 0,
      flowState: "dayflow",
    }))
  }

  const handleUpdateRitual = (ritualIndex: number, updatedRitual: Ritual) => {
    setAppState((prev) => {
      const updatedRituals = prev.rituals.map((ritual, index) => (index === ritualIndex ? updatedRitual : ritual))

      const ritual = updatedRitual
      if (ritual.completed) {
        const newCompletedRituals = [...prev.completedRituals]
        if (!newCompletedRituals.includes(ritual.id)) {
          newCompletedRituals.push(ritual.id)
        }

        // Check if there are more rituals to complete
        const nextRitualIndex = updatedRituals.findIndex((r, index) => index > ritualIndex && !r.completed)

        if (nextRitualIndex !== -1) {
          // Start the next ritual automatically
          return {
            ...prev,
            rituals: updatedRituals,
            completedRituals: newCompletedRituals,
            currentRitualIndex: nextRitualIndex,
            currentStepIndex: 0,
            // Stay in dayflow to continue with next ritual
          }
        }

        // No more rituals - check if this is the last ritual of the day
        const allRitualsCompleted = updatedRituals.every((r) => newCompletedRituals.includes(r.id))

        if (allRitualsCompleted) {
          // Check if any rituals were modified during execution
          const anyModified = updatedRituals.some((r) => r.wasModified || r.steps.some((s) => s.wasModified))

          // If no modifications, skip review and go straight to schedule
          const nextFlow = anyModified ? "review" : "schedule"

          return {
            ...prev,
            rituals: updatedRituals,
            completedRituals: newCompletedRituals,
            flowState: nextFlow,
          }
        }

        return {
          ...prev,
          rituals: updatedRituals,
          completedRituals: newCompletedRituals,
        }
      }

      return {
        ...prev,
        rituals: updatedRituals,
      }
    })
  }

  const handleUpdateStep = (ritualIndex: number, stepIndex: number, updatedStep: Step) => {
    setAppState((prev) => {
      const currentStep = prev.rituals[ritualIndex]?.steps[stepIndex]
      const wasModified =
        currentStep &&
        (currentStep.answer !== updatedStep.answer ||
          JSON.stringify(currentStep.weightliftingConfig) !== JSON.stringify(updatedStep.weightliftingConfig) ||
          JSON.stringify(currentStep.cardioConfig) !== JSON.stringify(updatedStep.cardioConfig))

      return {
        ...prev,
        rituals: prev.rituals.map((ritual, index) =>
          index === ritualIndex
            ? {
                ...ritual,
                steps: ritual.steps.map((step, sIndex) =>
                  sIndex === stepIndex ? { ...updatedStep, wasModified: wasModified || updatedStep.wasModified } : step,
                ),
                wasModified: ritual.wasModified || wasModified,
              }
            : ritual,
        ),
      }
    })
  }

  const handleUpdateStepIndex = (newStepIndex: number) => {
    setAppState((prev) => ({
      ...prev,
      currentStepIndex: newStepIndex,
    }))
  }

  const handleReorderRituals = (reorderedRituals: Ritual[]) => {
    setAppState((prev) => ({
      ...prev,
      rituals: reorderedRituals,
    }))
  }

  const handleRemoveRitual = (ritualIndex: number) => {
    setAppState((prev) => {
      const newRituals = prev.rituals.filter((_, index) => index !== ritualIndex)
      return {
        ...prev,
        rituals: newRituals,
        // Adjust current ritual index if needed
        currentRitualIndex:
          prev.currentRitualIndex >= ritualIndex ? Math.max(0, prev.currentRitualIndex - 1) : prev.currentRitualIndex,
        currentStepIndex: 0,
      }
    })
  }

  // Metrics handlers
  const handleShowMetrics = (ritual: Ritual) => {
    const metricsData = generateRitualMetricsData(ritual)
    setAppState((prev) => ({
      ...prev,
      showMetrics: true,
      selectedMetrics: {
        title: ritual.name,
        type: "ritual",
        data: metricsData,
      },
    }))
  }

  const handleCloseMetrics = () => {
    setAppState((prev) => ({
      ...prev,
      showMetrics: false,
      selectedMetrics: null,
    }))
  }

  // Changelog handlers
  const handleShowChangelog = (ritualId?: string, global = false) => {
    setAppState((prev) => ({
      ...prev,
      showChangelog: true,
      changelogRitualId: ritualId || null,
      showGlobalChangelog: global,
    }))
  }

  const handleCloseChangelog = () => {
    setAppState((prev) => ({
      ...prev,
      showChangelog: false,
      changelogRitualId: null,
      showGlobalChangelog: false,
    }))
  }

  // Review and Schedule handlers
  const handleContinueToSchedule = () => {
    setAppState((prev) => ({ ...prev, flowState: "proof-leaderboard" }))
  }

  const handleContinueToReflection = () => {
    setAppState((prev) => ({ ...prev, flowState: "reflection" }))
  }

  const handleScheduleRituals = (scheduledRituals: Ritual[]) => {
    setAppState((prev) => ({
      ...prev,
      rituals: scheduledRituals,
      completedRituals: [],
      flowState: "proof-leaderboard",
    }))
    setIsLibraryForScheduling(false)
  }

  // Library handlers
  const handleAddNewRitual = () => {
    setIsLibraryForScheduling(true)
    setAppState((prev) => ({ ...prev, flowState: "library" }))
  }

  const handleSelectRitualFromLibrary = (ritual: Ritual) => {
    // Add the selected ritual to the current rituals list
    setAppState((prev) => ({
      ...prev,
      rituals: [...prev.rituals, ritual],
      flowState: "schedule",
    }))
    setIsLibraryForScheduling(false)
  }

  // Update review data
  const handleUpdateReviewData = (rating: number, reflection: string) => {
    setAppState((prev) => ({
      ...prev,
      dayRating: rating,
      dayReflection: reflection,
    }))
  }

  // Shutdown complete - advance to next day
  const handleShutdownComplete = () => {
    // Calculate new proof score
    const completedToday = appState.completedRituals.length === appState.rituals.length
    const newProofScore = completedToday ? appState.proofScore * 1.01 : appState.proofScore * 0.99
    const newStreak = completedToday ? appState.currentStreak + 1 : 1

    setAppState((prev) => ({
      ...prev,
      flowState: "home",
      completedRituals: [],
      dayRating: 0,
      dayReflection: "",
      proofScore: newProofScore,
      currentStreak: newStreak,
      // Reset rituals for next day
      rituals: prev.rituals.map((ritual) => ({
        ...ritual,
        completed: false,
        wasModified: false,
        steps: ritual.steps.map((step) => ({
          ...step,
          completed: false,
          answer: undefined,
          wasModified: false,
        })),
      })),
    }))
  }

  // Get completed rituals for review
  const getCompletedRituals = () => {
    return appState.rituals.filter((ritual) => appState.completedRituals.includes(ritual.id))
  }

  // Render changelog screen
  if (appState.showChangelog) {
    return (
      <ChangelogScreen
        onClose={handleCloseChangelog}
        ritualId={appState.changelogRitualId}
        showGlobal={appState.showGlobalChangelog}
      />
    )
  }

  // Render metrics dashboard
  if (appState.showMetrics && appState.selectedMetrics) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Button variant="ghost" size="sm" onClick={handleCloseMetrics} className="text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <div className="text-white font-medium text-ios-subhead">{appState.selectedMetrics.title}</div>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex-1">
          <MetricsDashboard
            title={appState.selectedMetrics.title}
            type={appState.selectedMetrics.type}
            data={appState.selectedMetrics.data}
            onClose={handleCloseMetrics}
          />
        </div>
      </div>
    )
  }

  // Render main screens
  switch (appState.flowState) {
    case "auth":
      return <AuthScreen onAuthenticate={handleAuthenticate} />

    case "home":
      return (
        <HomeScreen
          rituals={appState.rituals}
          onNavigate={handleNavigate}
          onStartRitual={handleStartRitual}
          onShowMetrics={handleShowMetrics}
          onShowChangelog={handleShowChangelog}
          onReorderRituals={handleReorderRituals}
          onRemoveRitual={handleRemoveRitual}
          onUpdateRitual={handleUpdateRitual}
        />
      )

    case "library":
      return (
        <LibraryScreen
          onNavigate={handleNavigate}
          onSelectRitual={isLibraryForScheduling ? handleSelectRitualFromLibrary : undefined}
          showBackButton={isLibraryForScheduling}
          backDestination="schedule"
        />
      )

    case "journal":
      return <JournalScreen onNavigate={handleNavigate} />

    case "social":
      return <SocialScreen onNavigate={handleNavigate} />

    case "dayflow":
      return (
        <DayFlowScreen
          onNavigate={handleNavigate}
          rituals={appState.rituals}
          currentRitualIndex={appState.currentRitualIndex}
          currentStepIndex={appState.currentStepIndex}
          onUpdateRitual={handleUpdateRitual}
          onUpdateStep={handleUpdateStep}
          onUpdateStepIndex={handleUpdateStepIndex}
          onReorderRituals={handleReorderRituals}
          onRemoveRitual={handleRemoveRitual}
        />
      )

    case "review":
      return (
        <ReviewScreen
          onNavigate={handleNavigate}
          completedRituals={getCompletedRituals()}
          onUpdateRitual={(ritualIndex, updatedRitual) => {
            const completedRituals = getCompletedRituals()
            const originalRitualIndex = appState.rituals.findIndex((r) => r.id === completedRituals[ritualIndex].id)
            if (originalRitualIndex !== -1) {
              handleUpdateRitual(originalRitualIndex, updatedRitual)
            }
          }}
          onContinueToSchedule={handleContinueToSchedule}
          onUpdateReviewData={handleUpdateReviewData}
        />
      )

    case "schedule":
      return (
        <ScheduleScreen
          onNavigate={handleNavigate}
          rituals={appState.rituals}
          onScheduleRituals={handleScheduleRituals}
          onAddNewRitual={handleAddNewRitual}
          onReorderRituals={handleReorderRituals}
          onRemoveRitual={handleRemoveRitual}
        />
      )

    case "proof-leaderboard":
      return (
        <ProofLeaderboardScreen
          onNavigate={handleNavigate}
          currentUserStreak={appState.currentStreak}
          currentUserScore={appState.proofScore}
          onContinue={handleContinueToReflection}
        />
      )

    case "reflection":
      return (
        <ReflectionScreen
          onNavigate={handleNavigate}
          completedRituals={getCompletedRituals()}
          dayRating={appState.dayRating}
          dayReflection={appState.dayReflection}
          onShutdownComplete={handleShutdownComplete}
        />
      )

    default:
      return (
        <HomeScreen
          rituals={appState.rituals}
          onNavigate={handleNavigate}
          onStartRitual={handleStartRitual}
          onShowMetrics={handleShowMetrics}
          onShowChangelog={handleShowChangelog}
          onReorderRituals={handleReorderRituals}
          onRemoveRitual={handleRemoveRitual}
          onUpdateRitual={handleUpdateRitual}
        />
      )
  }
}
