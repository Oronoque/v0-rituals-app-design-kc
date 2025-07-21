"use client"
import { BottomNavigation } from "@/app/components/ui/bottom-navigation"
import type { FlowState } from "@/app/types"

interface SocialScreenProps {
  onNavigate: (flow: FlowState) => void
}

export function SocialScreen({ onNavigate }: SocialScreenProps) {
  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-ios-title-2 font-bold mb-2">Social</h2>
          <p className="text-[#AEAEB2] text-ios-body">Coming soon...</p>
        </div>
      </div>
      <BottomNavigation currentFlow="social" onNavigate={onNavigate} />
    </div>
  )
}
