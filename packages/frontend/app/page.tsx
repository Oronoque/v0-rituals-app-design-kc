"use client";
import { ChangelogScreen } from "@/app/components/changelog-screen";
import { CreateRitualFormV2 } from "@/app/components/create-ritual-form-v2";
import { AuthScreen } from "@/app/screens/auth-screen";
import { HomeScreen } from "@/app/screens/home-screen";
import { LibraryScreen } from "@/app/screens/library-screen";
import type { FlowState } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, Home, PenTool, Users } from "lucide-react";
import { useState } from "react";

export default function RitualsApp() {
  const [currentFlow, setCurrentFlow] = useState<FlowState>("home");
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogRitualId, setChangelogRitualId] = useState<string | null>(
    null
  );

  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const navItems = [
    {
      id: "home" as FlowState,
      label: "Home",
      icon: Home,
      emoji: "🏠",
    },
    {
      id: "library" as FlowState,
      label: "Library",
      icon: BookOpen,
      emoji: "📚",
    },
    {
      id: "schedule" as FlowState,
      label: "Schedule",
      icon: Calendar,
      emoji: "📅",
    },
    {
      id: "journal" as FlowState,
      label: "Journal",
      icon: PenTool,
      emoji: "📝",
    },
    {
      id: "social" as FlowState,
      label: "Social",
      icon: Users,
      emoji: "👥",
    },
  ];

  // Navigation handlers
  const handleNavigate = (screen: string) => {
    // Convert special navigation cases
    if (screen.startsWith("edit-")) {
      // Handle edit ritual navigation
      const ritualId = screen.replace("edit-", "");
      console.log("Edit ritual:", ritualId);
      // For now, go to library to find and edit the ritual
      setCurrentFlow("library-private");
      return;
    }

    if (screen.startsWith("completion-")) {
      // Handle view completion details
      const completionId = screen.replace("completion-", "");
      console.log("View completion:", completionId);
      // For now, just log - we'll implement this later
      return;
    }

    // Handle standard navigation
    const validFlows: FlowState[] = [
      "home",
      "auth",
      "library",
      "library-private",
      "library-public",
      "create",
      "dayflow",
      "schedule",
      "journal",
      "social",
      "settings",
    ];

    if (validFlows.includes(screen as FlowState)) {
      setCurrentFlow(screen as FlowState);
    } else {
      console.warn("Unknown navigation target:", screen);
      setCurrentFlow("home");
    }

    // Reset changelog when navigating
    setShowChangelog(false);
    setChangelogRitualId(null);
  };

  const handleShowChangelog = (ritualId: string) => {
    setChangelogRitualId(ritualId);
    setShowChangelog(true);
  };

  const showBottomNav = isAuthenticated && !showChangelog;

  // Show loading screen
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-[#8E8E93]">Loading your rituals...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Show changelog overlay (full screen)
  if (showChangelog && changelogRitualId) {
    return (
      <ChangelogScreen
        ritualId={changelogRitualId}
        onClose={() => setShowChangelog(false)}
      />
    );
  }

  // Main app content
  return (
    <>
      {/* Status Bar Simulation */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0" />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          showBottomNav ? "pb-20" : ""
        )}
      >
        {(() => {
          switch (currentFlow) {
            case "auth":
              return <AuthScreen />;

            case "home":
              return <HomeScreen onNavigate={handleNavigate} />;

            case "library":
            case "library-private":
            case "library-public":
              return (
                <LibraryScreen
                  onNavigate={handleNavigate}
                  onCreateRitual={() => handleNavigate("create")}
                />
              );

            case "create":
              return (
                <CreateRitualFormV2
                  onCancel={() => handleNavigate("home")}
                  onSuccess={() => handleNavigate("home")}
                />
              );

            case "dayflow":
              return <></>;

            case "settings":
              return (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-white">
                      Settings
                    </h2>
                    <p className="text-[#AEAEB2] mb-6">
                      Settings screen coming soon...
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleNavigate("home")}
                        className="bg-blue-500 hover:bg-blue-600 w-full"
                      >
                        Back to Home
                      </Button>
                      <Button
                        onClick={() => logout()}
                        variant="destructive"
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              );

            case "schedule":
            case "journal":
            case "social":
              return (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 capitalize text-white">
                      {currentFlow} Screen
                    </h2>
                    <p className="text-[#AEAEB2] mb-6">Coming soon...</p>
                    <Button
                      onClick={() => handleNavigate("home")}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              );

            default:
              return <HomeScreen onNavigate={handleNavigate} />;
          }
        })()}
      </div>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#3C3C3E]/30 bg-[#1C1C1E]/95 backdrop-blur-sm">
          <div className="flex items-center justify-around py-3 px-6">
            {navItems.map((item) => {
              const isActive = currentFlow === item.id;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="flex flex-col items-center gap-1 p-2 min-w-0"
                  onClick={() => handleNavigate(item.id)}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-blue-500 text-white"
                        : "bg-[#3C3C3E] text-[#8E8E93]"
                    )}
                  >
                    <span className="text-xs">{item.emoji}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      isActive ? "text-blue-500 font-medium" : "text-[#8E8E93]"
                    )}
                  >
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
