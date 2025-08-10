"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Mail, Target, User } from "lucide-react";
import { useState } from "react";

interface AuthScreenProps {
  onAuthenticate?: () => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const isLoading = isLoggingIn || isRegistering;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Please enter email and password");
      return;
    }

    if (authMode === "signup" && (!firstName || !lastName)) {
      setLocalError("Please enter your first and last name");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    try {
      if (authMode === "signin") {
        console.log("login", email, password);
        await login({ email, password });
      } else {
        console.log("register", email, password, firstName, lastName);
        await register({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        });
      }
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0E] via-[#1C1C1E] to-[#2C2C2E] flex items-center justify-center p-4">
      {/* Phone Container */}
      <div className="w-full max-w-sm mx-auto">
        {/* Phone Frame Effect */}
        <div className="bg-[#1C1C1E] rounded-3xl shadow-2xl border border-[#3C3C3E]/30 overflow-hidden">
          {/* Status Bar Simulation */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Main Content */}
          <div className="px-8 py-12">
            {/* App Branding */}
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Rituals
              </h1>
              <p className="text-[#8E8E93] text-sm leading-relaxed">
                Build better habits, one ritual at a time
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {/* Auth Mode Toggle */}
              <div className="bg-[#2C2C2E] rounded-2xl p-1.5 shadow-inner">
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAuthMode("signin");
                      setLocalError("");
                    }}
                    className={cn(
                      "flex-1 h-11 rounded-xl transition-all duration-200 font-medium text-sm",
                      authMode === "signin"
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
                    )}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAuthMode("signup");
                      setLocalError("");
                    }}
                    className={cn(
                      "flex-1 h-11 rounded-xl transition-all duration-200 font-medium text-sm",
                      authMode === "signup"
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C3E]"
                    )}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>

              {authMode === "signup" && (
                <>
                  {/* First Name Input */}
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <User className="w-5 h-5 text-[#8E8E93]" />
                      </div>
                      <Input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setLocalError("");
                        }}
                        className="h-14 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#8E8E93] rounded-2xl pl-12 pr-4 text-base focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  {/* Last Name Input */}
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <User className="w-5 h-5 text-[#8E8E93]" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setLocalError("");
                        }}
                        className="h-14 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#8E8E93] rounded-2xl pl-12 pr-4 text-base focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Input */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <Mail className="w-5 h-5 text-[#8E8E93]" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLocalError("");
                    }}
                    className="h-14 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#8E8E93] rounded-2xl pl-12 pr-4 text-base focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError("");
                    }}
                    className="h-14 bg-[#2C2C2E] border-[#3C3C3E] text-white placeholder-[#8E8E93] rounded-2xl pl-4 pr-14 text-base focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-[#3C3C3E] rounded-xl"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#8E8E93]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#8E8E93]" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {localError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-red-400 text-sm text-center font-medium">
                    {localError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!email || !password || isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all duration-200 transform active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    {authMode === "signin"
                      ? "Signing In..."
                      : "Creating Account..."}
                  </div>
                ) : authMode === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Password Requirements for Sign Up */}
            {authMode === "signup" && (
              <div className="mt-6 p-5 bg-[#2C2C2E]/60 rounded-2xl border border-[#3C3C3E]/50 backdrop-blur-sm">
                <p className="text-[#8E8E93] text-sm mb-3 font-medium">
                  Password requirements:
                </p>
                <ul className="text-xs text-[#8E8E93] space-y-1.5">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    At least 8 characters
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    One number
                  </li>
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-[#3C3C3E]/30">
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                By continuing, you agree to our{" "}
                <span className="text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors">
                  Privacy Policy
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
