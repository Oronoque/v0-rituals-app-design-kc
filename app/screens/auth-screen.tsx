"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthScreenProps {
  onAuthenticate: () => void
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  const [authInput, setAuthInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    onAuthenticate()
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-ios-title-1 font-bold mb-2">Rituals</h1>
          <p className="text-ios-body text-[#AEAEB2]">Build better habits, one ritual at a time</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex bg-[#2C2C2E] rounded-xl p-1">
            <Button
              variant="ghost"
              onClick={() => setAuthMode("signin")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-colors",
                authMode === "signin" ? "bg-blue-500 text-white" : "text-[#AEAEB2] hover:text-white",
              )}
            >
              Sign In
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAuthMode("signup")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-colors",
                authMode === "signup" ? "bg-blue-500 text-white" : "text-[#AEAEB2] hover:text-white",
              )}
            >
              Sign Up
            </Button>
          </div>

          <div className="flex bg-[#2C2C2E] rounded-xl p-1">
            <Button
              variant="ghost"
              onClick={() => setAuthMethod("email")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-colors",
                authMethod === "email" ? "bg-[#3C3C3E] text-white" : "text-[#AEAEB2] hover:text-white",
              )}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAuthMethod("phone")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-colors",
                authMethod === "phone" ? "bg-[#3C3C3E] text-white" : "text-[#AEAEB2] hover:text-white",
              )}
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </Button>
          </div>

          <Input
            type={authMethod === "email" ? "email" : "tel"}
            placeholder={authMethod === "email" ? "Enter your email" : "Enter your phone number"}
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
            className="h-12 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#AEAEB2] rounded-xl"
          />

          <Button
            onClick={handleAuth}
            disabled={!authInput || isLoading}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {authMode === "signin" ? "Signing In..." : "Creating Account..."}
              </div>
            ) : authMode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3C3C3E]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1C1C1E] text-[#AEAEB2]">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-12 bg-[#2C2C2E] border-[#3C3C3E] hover:bg-[#3C3C3E] text-white rounded-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#2C2C2E] border-[#3C3C3E] hover:bg-[#3C3C3E] text-white rounded-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.81.87.78 0 2.26-1.07 3.04 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-[#2C2C2E] border-[#3C3C3E] hover:bg-[#3C3C3E] text-white rounded-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
                />
              </svg>
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-ios-footnote text-[#AEAEB2]">
            By continuing, you agree to our <span className="text-blue-400 underline">Terms of Service</span> and{" "}
            <span className="text-blue-400 underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
