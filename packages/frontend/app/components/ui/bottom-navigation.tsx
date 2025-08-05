"use client"
import { Button } from "@/components/ui/button"
import { Target, Package, PenTool, Users } from "lucide-react"
import type { FlowState } from "@/app/types"

interface BottomNavigationProps {
  currentFlow: FlowState
  onNavigate: (flow: FlowState) => void
}

export function BottomNavigation({ currentFlow, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { id: "home" as FlowState, icon: Target, label: "Home" },
    { id: "library" as FlowState, icon: Package, label: "Library" },
    { id: "journal" as FlowState, icon: PenTool, label: "Journal" },
    { id: "social" as FlowState, icon: Users, label: "Social" },
  ]

  return (
    <div className="border-t border-gray-700">
      <div className="flex">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 h-16 flex flex-col items-center justify-center ${
              currentFlow === item.id ? "text-blue-400 bg-blue-500/10" : "text-[#AEAEB2] hover:text-white"
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-ios-caption">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
