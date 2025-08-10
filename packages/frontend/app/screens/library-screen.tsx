"use client";
import { CreateRitualFormV2 } from "@/app/components/create-ritual-form-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useForkRitual,
  usePublicRituals,
  useUserRituals,
} from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { RitualWithSteps } from "@rituals/shared";
import { Clock, Filter, Plus, Search, Star, Users } from "lucide-react";
import { useState } from "react";

interface LibraryScreenProps {
  onNavigate?: (screen: string) => void;
  onCreateRitual?: () => void;
}

const categories = [
  { id: "all", name: "All Categories" },
  { id: "wellness", name: "Wellness" },
  { id: "fitness", name: "Fitness" },
  { id: "productivity", name: "Productivity" },
  { id: "mindfulness", name: "Mindfulness" },
  { id: "health", name: "Health" },
];

interface RitualCardProps {
  ritual: RitualWithSteps;
  onFork?: (id: string) => void;
  onAdd?: (id: string) => void;
  isPublic?: boolean;
  isForking?: boolean;
}

function RitualCard({
  ritual,
  onFork,
  onAdd,
  isPublic = false,
  isForking = false,
}: RitualCardProps) {
  return (
    <div className="bg-[#2C2C2E] rounded-2xl p-4 space-y-3 border border-[#3C3C3E]/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white text-base truncate">
              {ritual.name}
            </h3>
            {isPublic && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-yellow-500 text-xs font-medium">
                  4.{Math.floor(Math.random() * 10)}
                </span>
              </div>
            )}
          </div>
          {isPublic && (
            <p className="text-[#8E8E93] text-xs">
              by user_{ritual.user_id.slice(-4)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          className="rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 flex-shrink-0 ml-2 shadow-lg shadow-blue-500/25"
          onClick={() => (isPublic ? onFork?.(ritual.id) : onAdd?.(ritual.id))}
          disabled={isForking}
        >
          {isForking ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Description */}
      {ritual.description && (
        <p className="text-[#8E8E93] text-xs leading-relaxed line-clamp-2">
          {ritual.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-[#8E8E93] text-xs">
        {isPublic && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{ritual.fork_count}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{ritual.step_definitions?.length || 0} steps</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {ritual.category && (
          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
            {ritual.category}
          </span>
        )}
        {ritual.location && (
          <span className="bg-[#3C3C3E] text-[#8E8E93] px-2 py-0.5 rounded-full text-xs">
            {ritual.location}
          </span>
        )}
        {isPublic && (
          <>
            <span className="bg-[#3C3C3E] text-[#8E8E93] px-2 py-0.5 rounded-full text-xs">
              Quick
            </span>
            <span className="bg-[#3C3C3E] text-[#8E8E93] px-2 py-0.5 rounded-full text-xs">
              Beginner
            </span>
          </>
        )}
      </div>

      {/* Time indicator for private rituals */}
      {!isPublic && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#3C3C3E]/50">
          <Clock className="w-3 h-3 text-[#8E8E93]" />
          <span className="text-[#8E8E93] text-xs">06:00</span>
          <span className="text-[#8E8E93] text-xs">•</span>
          <span className="text-[#8E8E93] text-xs">
            {ritual.category || "General"}
          </span>
        </div>
      )}
    </div>
  );
}

export function LibraryScreen({
  onNavigate,
  onCreateRitual,
}: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { isAuthenticated } = useAuth();
  const forkRitualMutation = useForkRitual();

  // Fetch data based on active tab
  const { data: publicData, isLoading: publicLoading } = usePublicRituals({
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    limit: 20,
    offset: 0,
  });

  const { data: privateData, isLoading: privateLoading } = useUserRituals({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    limit: 20,
    offset: 0,
  });

  const handleFork = (ritualId: string) => {
    if (!isAuthenticated) return;
    forkRitualMutation.mutate(ritualId);
  };

  const handleCreateClick = () => {
    setShowCreateForm(true);
    onCreateRitual?.();
  };

  const currentData = activeTab === "public" ? publicData : privateData;
  const isLoading = activeTab === "public" ? publicLoading : privateLoading;
  const rituals = currentData?.rituals || [];

  // Show create ritual form
  if (showCreateForm) {
    return <CreateRitualFormV2 onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ritual Library
            </h1>
            <p className="text-[#8E8E93] text-sm">
              Discover and create rituals
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8E8E93] hover:text-white p-2 rounded-xl"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#2C2C2E] rounded-2xl p-1.5 mb-6 shadow-inner">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("public")}
            className={cn(
              "flex-1 h-11 rounded-xl transition-all duration-200 font-medium text-sm",
              activeTab === "public"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
            )}
          >
            <Users className="w-4 h-4 mr-2" />
            Public
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("private")}
            className={cn(
              "flex-1 h-11 rounded-xl transition-all duration-200 font-medium text-sm",
              activeTab === "private"
                ? "bg-[#3C3C3E] text-white"
                : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
            )}
          >
            <span className="w-4 h-4 mr-2">🔒</span>
            Private
          </Button>
          <Button
            variant="ghost"
            onClick={handleCreateClick}
            className="flex-1 h-11 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 font-medium shadow-lg shadow-yellow-600/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
          <Input
            placeholder="Search rituals, tags, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#8E8E93] rounded-2xl pl-12 pr-4 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all",
                selectedCategory === category.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-[#2C2C2E] text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#2C2C2E] rounded-2xl p-5 animate-pulse"
                >
                  <div className="h-6 bg-[#3C3C3E] rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-[#3C3C3E] rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-[#3C3C3E] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : rituals.length > 0 ? (
            <div className="space-y-4">
              {rituals.map((ritual) => (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onFork={handleFork}
                  onAdd={() => {
                    /* Handle add to schedule */
                  }}
                  isPublic={activeTab === "public"}
                  isForking={forkRitualMutation.isPending}
                />
              ))}
            </div>
          ) : activeTab === "private" ? (
            // Empty state for private rituals
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Plus className="w-12 h-12 text-[#8E8E93]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create New Ritual</h3>
              <p className="text-[#8E8E93] mb-6 leading-relaxed">
                Build a custom ritual from scratch
              </p>
              <Button
                onClick={handleCreateClick}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-green-500/25"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
            </div>
          ) : (
            // No results state
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#2C2C2E] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-[#8E8E93]" />
              </div>
              <p className="text-[#8E8E93]">No rituals found</p>
              <p className="text-[#8E8E93] text-sm mt-1">
                Try adjusting your search or category
              </p>
            </div>
          )}

          {/* Extra padding at bottom for better scrolling */}
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}
