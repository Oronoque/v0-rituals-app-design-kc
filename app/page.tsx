"use client"
import { useState } from "react"
import { AuthScreen } from "@/app/screens/auth-screen"
import { LibraryScreen } from "@/app/screens/library-screen"
import { Button } from "@/components/ui/button"
import { Target, Plus, BookOpen, Users, Calendar, LogOut, RefreshCw } from "lucide-react"
import { 
  useAuth, 
  useUserRituals, 
  usePublicRituals,
  useForkRitual 
} from "@/hooks/use-api"

type AppScreen = "home" | "library" | "schedule" | "social" | "journal"

export default function RitualsApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home")
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  
  // Fetch user rituals with React Query
  const { 
    data: userRitualsData, 
    isLoading: userRitualsLoading, 
    refetch: refetchUserRituals 
  } = useUserRituals({ limit: 10 })
  
  // Fetch public rituals with React Query
  const { 
    data: publicRitualsData, 
    isLoading: publicRitualsLoading 
  } = usePublicRituals({ limit: 5, sort_by: 'fork_count', sort_order: 'desc' })
  
  // Fork ritual mutation
  const forkRitualMutation = useForkRitual()

  const userRituals = userRitualsData?.rituals || []
  const publicRituals = publicRitualsData?.rituals || []

  const handleForkRitual = (ritualId: string) => {
    forkRitualMutation.mutate(ritualId)
  }

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as AppScreen)
  }

  const handleCreateRitual = () => {
    setCurrentScreen("library")
  }

  // Show loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D0E] via-[#1C1C1E] to-[#2C2C2E] flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-[#1C1C1E] rounded-3xl shadow-2xl border border-[#3C3C3E]/30 p-8">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[#8E8E93]">Loading your rituals...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  // Handle different screens
  if (currentScreen === "library") {
    return (
      <LibraryScreen 
        onNavigate={handleNavigate} 
        onCreateRitual={handleCreateRitual}
      />
    )
  }

  // Show main dashboard when authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0E] via-[#1C1C1E] to-[#2C2C2E] flex items-center justify-center p-4">
      {/* Phone Container */}
      <div className="w-full max-w-sm mx-auto">
        {/* Phone Frame Effect */}
        <div className="bg-[#1C1C1E] rounded-3xl shadow-2xl border border-[#3C3C3E]/30 overflow-hidden h-[800px] flex flex-col">
          {/* Status Bar Simulation */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0"></div>
          
          {/* Header */}
          <div className="p-6 border-b border-[#3C3C3E]/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mr-4 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Welcome back!
                  </h1>
                  <p className="text-[#8E8E93] text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchUserRituals()}
                  className="text-[#8E8E93] hover:text-white p-2 rounded-xl"
                  disabled={userRitualsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${userRitualsLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => logout()}
                  className="text-[#8E8E93] hover:text-white p-2 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#2C2C2E] rounded-2xl p-4 backdrop-blur-sm border border-[#3C3C3E]/30">
                  <p className="text-[#8E8E93] text-xs mb-1">Current Streak</p>
                  <p className="text-xl font-bold text-blue-400">{user?.current_streak || 0}</p>
                </div>
                <div className="bg-[#2C2C2E] rounded-2xl p-4 backdrop-blur-sm border border-[#3C3C3E]/30">
                  <p className="text-[#8E8E93] text-xs mb-1">Proof Score</p>
                  <p className="text-xl font-bold text-green-400">{user?.proof_score || '1.0000'}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCreateRitual}
                    className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 transform active:scale-95"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create
                  </Button>
                  <Button 
                    onClick={() => setCurrentScreen("library")}
                    className="h-14 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white rounded-2xl font-medium border border-[#3C3C3E]/50 transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              {/* My Rituals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">
                    My Rituals ({userRitualsData?.total || 0})
                  </h2>
                  {userRitualsLoading && (
                    <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </div>
                
                {userRitualsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-[#2C2C2E] rounded-2xl p-4 animate-pulse">
                        <div className="h-5 bg-[#3C3C3E] rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-[#3C3C3E] rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userRituals.length > 0 ? (
                  <div className="space-y-3">
                    {userRituals.slice(0, 3).map((ritual) => (
                      <div key={ritual.id} className="bg-[#2C2C2E] rounded-2xl p-4 border border-[#3C3C3E]/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-1">{ritual.name}</h3>
                            <p className="text-[#8E8E93] text-sm">{ritual.steps.length} steps</p>
                            {ritual.description && (
                              <p className="text-[#8E8E93] text-xs mt-1 leading-relaxed">{ritual.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-3">
                            <div className="flex items-center gap-2">
                              {ritual.is_public && (
                                <div className="w-2 h-2 bg-green-400 rounded-full" title="Public" />
                              )}
                              {ritual.category && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                  {ritual.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userRituals.length > 3 && (
                      <Button 
                        onClick={() => setCurrentScreen("library")}
                        variant="ghost" 
                        className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-2xl"
                      >
                        View all {userRituals.length} rituals
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#2C2C2E] rounded-2xl p-6 text-center border border-[#3C3C3E]/30 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Target className="w-8 h-8 text-[#8E8E93]" />
                    </div>
                    <p className="text-[#8E8E93] mb-3">No rituals yet</p>
                    <Button 
                      onClick={handleCreateRitual}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl px-6 py-2 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Ritual
                    </Button>
                  </div>
                )}
              </div>

              {/* Popular Rituals */}
              {publicRituals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Popular Rituals</h2>
                    {publicRitualsLoading && (
                      <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    )}
                  </div>
                  
                  {publicRitualsLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-[#2C2C2E] rounded-2xl p-4 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="h-5 bg-[#3C3C3E] rounded mb-2 w-3/4"></div>
                              <div className="h-4 bg-[#3C3C3E] rounded w-1/2"></div>
                            </div>
                            <div className="w-16 h-8 bg-[#3C3C3E] rounded ml-4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {publicRituals.slice(0, 2).map((ritual) => (
                        <div key={ritual.id} className="bg-[#2C2C2E] rounded-2xl p-4 border border-[#3C3C3E]/30 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-white mb-1">{ritual.name}</h3>
                              <p className="text-[#8E8E93] text-sm">
                                {ritual.fork_count} forks • {ritual.steps.length} steps
                              </p>
                              {ritual.description && (
                                <p className="text-[#8E8E93] text-xs mt-1 leading-relaxed">{ritual.description}</p>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleForkRitual(ritual.id)}
                              disabled={forkRitualMutation.isPending}
                              className="ml-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-3 py-1 text-xs font-medium disabled:opacity-50"
                            >
                              {forkRitualMutation.isPending ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                "Fork"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Extra padding at bottom for better scrolling */}
              <div className="h-4"></div>
            </div>
          </div>

          {/* Bottom Navigation - Always Visible */}
          <div className="border-t border-[#3C3C3E]/30 bg-[#1C1C1E]/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-around py-3 px-6">
              <Button 
                onClick={() => setCurrentScreen("home")}
                variant="ghost" 
                className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-400 p-2"
              >
                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white">🏠</span>
                </div>
                <span className="text-xs font-medium">Home</span>
              </Button>
              <Button 
                onClick={() => setCurrentScreen("schedule")}
                variant="ghost" 
                className="flex flex-col items-center gap-1 text-[#8E8E93] hover:text-white p-2"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Schedule</span>
              </Button>
              <Button 
                onClick={() => setCurrentScreen("library")}
                variant="ghost" 
                className="flex flex-col items-center gap-1 text-[#8E8E93] hover:text-white p-2"
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">Library</span>
              </Button>
              <Button 
                onClick={() => setCurrentScreen("social")}
                variant="ghost" 
                className="flex flex-col items-center gap-1 text-[#8E8E93] hover:text-white p-2"
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">Social</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
