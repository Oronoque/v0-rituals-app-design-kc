"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCompleteRitual, useDailySchedule } from "@/hooks/use-api";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  CompleteRitualSchemaType,
  FullRitual,
  FullRitualCompletion,
} from "@rituals/shared";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Circle,
  Plus,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { RitualCard } from "../components/ritual-card";
import { RitualDetailBottomSheet } from "../components/ritual-detail-bottom-sheet";
import { StepCompletionForm } from "../components/step-completion-form";
import { DatePicker } from "../components/ui/floating-date-picker";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [selectedRitual, setSelectedRitual] = useState<FullRitual | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const dateString = new Date(selectedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Fetch user and daily schedule
  const { data: user } = useCurrentUser();
  const {
    data: schedule,
    isLoading,
    error,
    refetch,
  } = useDailySchedule(selectedDate);
  const completeRitualMutation = useCompleteRitual();

  const scheduledRituals = schedule?.scheduled_rituals || [];
  const completedRituals = schedule?.completed_rituals || [];
  const totalRituals = scheduledRituals.length + completedRituals.length;
  const completedCount = completedRituals.length;

  const handleStartRitual = (ritual: FullRitual) => {
    setSelectedRitual(ritual);
    setShowCompletionForm(true);
    setShowDetailSheet(false);
  };

  const handleViewRitualDetails = (ritual: FullRitual) => {
    setSelectedRitual(ritual);
    setShowDetailSheet(true);
  };

  const handleCloseDetailSheet = () => {
    setShowDetailSheet(false);
    setSelectedRitual(null);
  };

  const handleCompleteRitual = async (
    completionData: Omit<CompleteRitualSchemaType, "ritual_id">
  ) => {
    if (!selectedRitual) return;

    try {
      await completeRitualMutation.mutateAsync({
        id: selectedRitual.id,
        completion: completionData,
      });
      setShowCompletionForm(false);
      setSelectedRitual(null);
      refetch();
    } catch (error) {
      console.error("Failed to complete ritual:", error);
    }
  };

  if (showCompletionForm && selectedRitual) {
    return (
      <StepCompletionForm
        ritual={selectedRitual}
        onComplete={handleCompleteRitual}
        onCancel={() => {
          setShowCompletionForm(false);
          setSelectedRitual(null);
        }}
        isLoading={completeRitualMutation.isPending}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E]/30 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-white font-medium text-lg">
            {selectedDate === today ? "Today" : "Schedule"}
          </h1>
          <p className="text-[#AEAEB2] text-sm">{dateString}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-[#AEAEB2] hover:text-white p-2"
            disabled={isLoading}
          >
            <Calendar
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("create")}
            className="text-[#AEAEB2] hover:text-white p-2"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("settings")}
            className="text-[#AEAEB2] hover:text-white p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Date Picker */}
      <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <div className="flex-1 overflow-y-auto p-4">
        {/* User Progress Summary */}
        {user && (
          <Card className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Welcome back, {user.first_name}!
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Current streak: {user.current_streak} days
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(
                      (completedCount / Math.max(totalRituals, 1)) * 100
                    )}
                    %
                  </div>
                  <div className="text-gray-300 text-sm">completed today</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalRituals > 0
                        ? (completedCount / totalRituals) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-300 mt-2">
                <span>{completedCount} completed</span>
                <span>{totalRituals - completedCount} remaining</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {totalRituals}
              </div>
              <div className="text-xs text-[#AEAEB2]">Scheduled</div>
            </CardContent>
          </Card>
          <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {completedCount}
              </div>
              <div className="text-xs text-[#AEAEB2]">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {user?.current_streak || 0}
              </div>
              <div className="text-xs text-[#AEAEB2]">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 bg-red-600/20 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-red-300 text-center">
                Failed to load your rituals. Please try again.
              </p>
              <Button
                onClick={() => refetch()}
                className="w-full mt-3 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Retry"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !schedule && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#8E8E93] text-sm">Loading your rituals...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && schedule && (
          <>
            {totalRituals === 0 ? (
              /* Empty State */
              <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    No rituals scheduled
                  </h3>
                  <p className="text-[#AEAEB2] mb-6">
                    Start building better habits by creating your first ritual.
                  </p>
                  <Button
                    onClick={() => onNavigate("create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Ritual
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Scheduled (Incomplete) Rituals */}
                {scheduledRituals.length > 0 && (
                  <div>
                    <h2 className="text-white font-semibold text-lg mb-4 flex items-center">
                      <Circle className="w-5 h-5 mr-2 text-blue-400" />
                      Scheduled Rituals
                    </h2>
                    <div className="space-y-3">
                      {scheduledRituals.map((ritual) => (
                        <RitualCard
                          key={ritual.id}
                          ritual={ritual}
                          isMyRitual={true}
                          onRitualClick={() => handleViewRitualDetails(ritual)}
                          onStartRitual={() => handleStartRitual(ritual)}
                          showStartButton={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Rituals */}
                {completedRituals.length > 0 && (
                  <div>
                    <h2 className="text-white font-semibold text-lg mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                      Completed Rituals
                    </h2>
                    <div className="space-y-3">
                      {completedRituals.map((completion) => (
                        <CompletedRitualCard
                          key={completion.id}
                          completion={completion}
                          onViewDetails={() =>
                            onNavigate(`completion-${completion.id}`)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <Button
            onClick={() => onNavigate("create")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Ritual
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onNavigate("library-private")}
              variant="outline"
              className="text-gray-300 border-gray-600"
            >
              My Library
            </Button>
            <Button
              onClick={() => onNavigate("library-public")}
              variant="outline"
              className="text-gray-300 border-gray-600"
            >
              Public Library
            </Button>
          </div>
        </div>

        {/* Ritual Detail Bottom Sheet */}
        <RitualDetailBottomSheet
          ritual={selectedRitual}
          isOpen={showDetailSheet}
          onClose={handleCloseDetailSheet}
          onStartRitual={handleStartRitual}
          isMyRitual={true}
        />
      </div>
    </div>
  );
}

// Completed Ritual Card Component
function CompletedRitualCard({
  completion,
  onViewDetails,
}: {
  completion: FullRitualCompletion;
  onViewDetails: () => void;
}) {
  const completedAt = new Date(
    completion.completion_data.completed_at
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="bg-green-500/10 border-green-500/30 opacity-75">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-white font-medium text-base mb-1">
              {completion.name}
            </h3>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span className="flex items-center text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed at {completedAt}
              </span>
            </div>
            {completion.completion_data.notes && (
              <p className="text-gray-400 text-sm mt-2 italic">
                "{completion.completion_data.notes}"
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onViewDetails}
            className="text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
