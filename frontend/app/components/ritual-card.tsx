import { Button } from "@/components/ui/button";
import { FullRitual } from "@rituals/shared";
import { Clock, Lock, LockOpen, MapPin, Play, Plus, Users } from "lucide-react";

interface RitualCardProps {
  ritual: FullRitual;
  isMyRitual?: boolean;
  onFork?: (id: string) => void;
  onRitualClick?: (ritual: FullRitual) => void;
  onStartRitual?: (ritual: FullRitual) => void;
  isPublicRituals?: boolean;
  isForking?: boolean;
  showStartButton?: boolean;
}

export function RitualCard({
  ritual,
  onFork,
  onRitualClick,
  onStartRitual,
  isMyRitual,
  isPublicRituals,
  isForking = false,
  showStartButton = false,
}: RitualCardProps) {
  return (
    <div
      className="bg-[#2C2C2E] rounded-2xl p-4 space-y-3 border border-[#3C3C3E]/30 backdrop-blur-sm cursor-pointer hover:bg-[#3C3C3E]/30 transition-colors"
      onClick={() => onRitualClick?.(ritual)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white text-base truncate">
              {ritual.name}
            </h3>
          </div>
          <p className="text-[#8E8E93] text-xs">
            by {ritual.user_id.slice(0, 8)}
          </p>
        </div>
        {!isMyRitual && (
          <Button
            size="sm"
            className="rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 flex-shrink-0 ml-2 shadow-lg shadow-blue-500/25"
            onClick={(e) => {
              e.stopPropagation();
              onFork?.(ritual.id);
            }}
            disabled={isForking}
          >
            {isForking ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        )}
        {isPublicRituals ? (
          <LockOpen className="w-4 h-4 text-[#8E8E93]" />
        ) : (
          <Lock className="w-4 h-4 text-[#8E8E93]" />
        )}
      </div>

      {/* Description */}
      {ritual.description && (
        <p className="text-[#8E8E93] text-xs leading-relaxed line-clamp-2">
          {ritual.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-[#8E8E93] text-xs">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{ritual.fork_count}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{ritual.step_definitions?.length || 0} steps</span>
        </div>
      </div>

      {/* Frequency Info */}
      <div className="text-xs text-gray-500 mb-3">
        {ritual.frequency.frequency_type === "daily" && "Daily ritual"}
        {ritual.frequency.frequency_type === "weekly" &&
          `Weekly on ${ritual.frequency.days_of_week
            ?.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ")}`}
        {ritual.frequency.frequency_type === "custom" && "Custom schedule"}
      </div>
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {ritual.category && (
          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
            {ritual.category}
          </span>
        )}
        {ritual.location && (
          <span className="flex items-center gap-1 bg-[#3C3C3E] text-[#8E8E93] px-2 py-0.5 rounded-full text-xs">
            <MapPin className="w-3 h-3" />
            {ritual.location}
          </span>
        )}
      </div>

      {/* Start Button */}
      {showStartButton && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onStartRitual?.(ritual);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Ritual
        </Button>
      )}
    </div>
  );
}
