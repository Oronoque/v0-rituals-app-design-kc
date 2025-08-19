"use client";
import { CreateRitualFormV2 } from "@/app/components/create-ritual-form-v2";
import { RitualDetailBottomSheet } from "@/app/components/ritual-detail-bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useForkRitual,
  usePublicRituals,
  useUserRituals,
} from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { FullRitual, RitualCategory } from "@rituals/shared";
import { Filter, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { RitualCard } from "../components/ritual-card";

interface LibraryScreenProps {
  onNavigate?: (screen: string) => void;
  onCreateRitual?: () => void;
}

const categories: { id: RitualCategory | "all"; name: string }[] = [
  { id: "all", name: "All Categories" },
  { id: "wellness", name: "Wellness" },
  { id: "fitness", name: "Fitness" },
  { id: "learning", name: "Learning" },
  { id: "productivity", name: "Productivity" },
  { id: "social", name: "Social" },
  { id: "spiritual", name: "Spiritual" },
  { id: "other", name: "Other" },
];

export function LibraryScreen({ onCreateRitual }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<"publicRituals" | "userRituals">(
    "publicRituals"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRitual, setSelectedRitual] = useState<FullRitual | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const forkRitualMutation = useForkRitual();

  // Fetch data based on active tab
  const { data: publicRitualsData, isLoading: publicRitualsLoading } =
    usePublicRituals({
      search: activeTab === "publicRituals" ? searchQuery : undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      limit: 20,
      offset: 0,
    });

  const { data: userRitualsData, isLoading: userRitualsLoading } =
    useUserRituals({
      search: activeTab === "userRituals" ? searchQuery : undefined,
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

  const handleRitualClick = (ritual: FullRitual) => {
    setSelectedRitual(ritual);
    setShowDetailSheet(true);
  };

  const handleCloseDetailSheet = () => {
    setShowDetailSheet(false);
    setSelectedRitual(null);
  };

  const currentData =
    activeTab === "publicRituals" ? publicRitualsData : userRitualsData;
  const isLoading =
    activeTab === "publicRituals" ? publicRitualsLoading : userRitualsLoading;
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
        <div className="flex bg-[#2C2C2E] rounded-2xl p-1 mb-6 shadow-inner gap-1">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("publicRituals")}
            className={cn(
              "flex-1 h-10 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center px-2",
              activeTab === "publicRituals"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
            )}
          >
            <Users className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">Public</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("userRituals")}
            className={cn(
              "flex-1 h-10 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center px-2",
              activeTab === "userRituals"
                ? "bg-[#3C3C3E] text-white"
                : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
            )}
          >
            <span className="w-4 h-4 mr-1.5 flex-shrink-0 flex items-center justify-center text-xs">
              🔒
            </span>
            <span className="truncate">My Rituals</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleCreateClick}
            className="flex-1 h-10 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 font-medium shadow-lg shadow-yellow-600/25 flex items-center justify-center px-2"
          >
            <Plus className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">Create</span>
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
                  isMyRitual={ritual.user_id === user?.id}
                  onFork={handleFork}
                  onRitualClick={handleRitualClick}
                  isPublicRituals={ritual.is_public}
                  isForking={forkRitualMutation.isPending}
                />
              ))}
            </div>
          ) : activeTab === "userRituals" ? (
            // Empty state for userRituals rituals
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

      {/* Ritual Detail Bottom Sheet */}
      <RitualDetailBottomSheet
        ritual={selectedRitual}
        isOpen={showDetailSheet}
        onClose={handleCloseDetailSheet}
        onForkRitual={handleFork}
        isMyRitual={selectedRitual?.user_id === user?.id}
      />
    </div>
  );
}
