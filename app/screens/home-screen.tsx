"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Settings, ChevronRight, CheckCircle, Circle, Clock, Play, Edit, Trash2 } from "lucide-react"
import { useDailySchedule, useCurrentUser, useCompleteRitual, useDeleteRitual } from "@/hooks/use-api"
import { RitualWithConfig, RitualCompletionWithSteps } from "@/backend/src/types/database"
import { CompleteRitual } from "@/backend/src/utils/validation-extended"
import { toast } from "sonner"
import { StepCompletionForm } from "../components/step-completion-form"

interface HomeScreenProps {
  onNavigate: (screen: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [selectedRitual, setSelectedRitual] = useState<RitualWithConfig | null>(null)
  const [showCompletionForm, setShowCompletionForm] = useState(false)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  // Fetch user and daily schedule
  const { data: user } = useCurrentUser()
  const { data: schedule, isLoading, error, refetch } = useDailySchedule(today)
  const completeRitualMutation = useCompleteRitual()
  const deleteRitualMutation = useDeleteRitual()

  const scheduledRituals = schedule?.scheduled_rituals || []
  const completedRituals = schedule?.completed_rituals || []
  const totalRituals = scheduledRituals.length + completedRituals.length
  const completedCount = completedRituals.length

  const handleStartRitual = (ritual: RitualWithConfig) => {
    setSelectedRitual(ritual)
    setShowCompletionForm(true)
  }

  const handleCompleteRitual = async (completionData: Omit<CompleteRitual, 'ritual_id'>) => {
    if (!selectedRitual) return

    try {
      await completeRitualMutation.mutateAsync({
        id: selectedRitual.id,
        completion: completionData
      })
      setShowCompletionForm(false)
      setSelectedRitual(null)
      refetch()
    } catch (error) {
      console.error('Failed to complete ritual:', error)
    }
  }

  const handleDeleteRitual = async (ritualId: string) => {
    try {
      await deleteRitualMutation.mutateAsync(ritualId)
      refetch()
    } catch (error) {
      console.error('Failed to delete ritual:', error)
    }
  }

  if (showCompletionForm && selectedRitual) {
    return (
      <StepCompletionForm
        ritual={selectedRitual}
        onComplete={handleCompleteRitual}
        onCancel={() => {
          setShowCompletionForm(false)
          setSelectedRitual(null)
        }}
        isLoading={completeRitualMutation.isPending}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3C3C3E]/30 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-white font-medium text-lg">Today</h1>
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
            <Calendar className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
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
                    {Math.round((completedCount / Math.max(totalRituals, 1)) * 100)}%
                  </div>
                  <div className="text-gray-300 text-sm">
                    completed today
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalRituals > 0 ? (completedCount / totalRituals) * 100 : 0}%` }}
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
              <div className="text-2xl font-bold text-blue-400">{totalRituals}</div>
              <div className="text-xs text-[#AEAEB2]">Scheduled</div>
            </CardContent>
          </Card>
          <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
              <div className="text-xs text-[#AEAEB2]">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-[#2C2C2E] border-[#3C3C3E]">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{user?.current_streak || 0}</div>
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
                {isLoading ? 'Loading...' : 'Retry'}
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
                  <h3 className="text-white font-semibold text-lg mb-2">No rituals scheduled</h3>
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
                        <RitualScheduleCard
                          key={ritual.id}
                          ritual={ritual}
                          isCompleted={false}
                          onStart={() => handleStartRitual(ritual)}
                          onEdit={() => onNavigate(`edit-${ritual.id}`)}
                          onDelete={() => handleDeleteRitual(ritual.id)}
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
                          onViewDetails={() => onNavigate(`completion-${completion.id}`)}
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
      </div>
    </div>
  )
}

// Ritual Schedule Card Component
function RitualScheduleCard({ 
  ritual, 
  isCompleted, 
  onStart, 
  onEdit, 
  onDelete 
}: {
  ritual: RitualWithConfig
  isCompleted: boolean
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-medium text-base mb-1">{ritual.name}</h3>
            {ritual.description && (
              <p className="text-gray-400 text-sm mb-2">{ritual.description}</p>
            )}
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <Badge variant="secondary" className="text-xs">
                {ritual.category}
              </Badge>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {ritual.step_definitions.length} steps
              </span>
              {ritual.location && (
                <span>{ritual.location}</span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="text-gray-400 hover:text-white p-1"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-400 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Frequency Info */}
        <div className="text-xs text-gray-500 mb-3">
          {ritual.frequency.frequency_type === 'daily' && 'Daily ritual'}
          {ritual.frequency.frequency_type === 'weekly' && 
            `Weekly on ${ritual.frequency.days_of_week?.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`
          }
          {ritual.frequency.frequency_type === 'custom' && 'Custom schedule'}
        </div>

        {/* Start Button */}
        <Button 
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isCompleted}
        >
          <Play className="w-4 h-4 mr-2" />
          {isCompleted ? 'Completed' : 'Start Ritual'}
        </Button>
      </CardContent>
    </Card>
  )
}

// Completed Ritual Card Component
function CompletedRitualCard({ 
  completion, 
  onViewDetails 
}: {
  completion: RitualCompletionWithSteps
  onViewDetails: () => void
}) {
  const completedAt = new Date(completion.completed_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <Card className="bg-green-500/10 border-green-500/30 opacity-75">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-white font-medium text-base mb-1">
              {completion.ritual_with_config.name}
            </h3>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span className="flex items-center text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed at {completedAt}
              </span>
              {completion.duration_seconds && (
                <span>
                  {Math.round(completion.duration_seconds / 60)} minutes
                </span>
              )}
            </div>
            {completion.notes && (
              <p className="text-gray-400 text-sm mt-2 italic">"{completion.notes}"</p>
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
  )
}

