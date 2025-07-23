"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Brain,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Power,
  Send,
  MessageCircle,
} from "lucide-react"
import type { FlowState } from "@/app/types"
import { cn } from "@/lib/utils"
import { RitualWithSteps } from "@/backend/src/types/database"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ReflectionScreenProps {
  onNavigate: (flow: FlowState) => void
  completedRituals: RitualWithSteps[]
  dayRating: number
  dayReflection: string
  onShutdownComplete: () => void
}

export function ReflectionScreen({
  onNavigate,
  completedRituals,
  dayRating,
  dayReflection,
  onShutdownComplete,
}: ReflectionScreenProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(true)
  const [showShutdown, setShowShutdown] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [isAiResponding, setIsAiResponding] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Calculate completion stats
  const totalSteps = completedRituals.reduce((sum, ritual) => sum + ritual.step_definitions.length, 0)
  const completedSteps = completedRituals.reduce(
    (sum, ritual) => sum + ritual.step_definitions.filter((step) => step.is_required).length,
    0,
  )
  const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Generate AI analysis
  useEffect(() => {
    const generateAnalysis = async () => {
      setIsGenerating(true)

      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Analyze sentiment and generate Jungian perspective
      const analysis = generateJungianAnalysis(completedRituals, dayRating, dayReflection, completionRate)

      setAiAnalysis(analysis)
      setIsGenerating(false)

      // Show shutdown button after analysis is complete
      setTimeout(() => setShowShutdown(true), 1000)
    }

    generateAnalysis()
  }, [completedRituals, dayRating, dayReflection, completionRate])

  const generateJungianAnalysis = (
    rituals: RitualWithSteps[],
    rating: number,
    reflection: string,
    completion: number,
  ): string => {
    // Analyze the disconnect between completion and rating
    const highCompletion = completion >= 80
    const lowRating = rating <= 2
    const highRating = rating >= 4

    // Simple sentiment analysis based on word choice
    const positiveWords = [
      "good",
      "great",
      "amazing",
      "wonderful",
      "happy",
      "joy",
      "success",
      "accomplished",
      "proud",
      "grateful",
    ]
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "sad",
      "frustrated",
      "angry",
      "disappointed",
      "failed",
      "stressed",
      "overwhelmed",
    ]

    const reflectionLower = reflection.toLowerCase()
    const positiveCount = positiveWords.filter((word) => reflectionLower.includes(word)).length
    const negativeCount = negativeWords.filter((word) => reflectionLower.includes(word)).length

    let analysis = ""

    // Address completion vs rating disconnect
    if (highCompletion && lowRating) {
      analysis +=
        "There's a fascinating disconnect here - you accomplished what you set out to do with remarkable consistency, yet your subjective experience of the day feels unsatisfying. Jung would suggest this points to a deeper question: are you pursuing the right goals, or are you perhaps living according to someone else's definition of success? "
    } else if (!highCompletion && highRating) {
      analysis +=
        "Interesting - despite not completing all your intended rituals, you rated your day highly. This suggests an intuitive wisdom at work, recognizing that true fulfillment doesn't always align with external metrics. Perhaps your psyche is telling you that being present and accepting is more valuable than rigid adherence to plans. "
    } else if (highCompletion && highRating) {
      analysis +=
        "Beautiful alignment between intention and experience today. You followed through on your commitments and felt genuinely satisfied - this is what Jung called 'individuation' in action, where your conscious goals and unconscious needs are working in harmony. "
    } else {
      analysis +=
        "Today seems to reflect the natural ebb and flow of human experience. Not every day can be perfect, and Jung would remind us that our 'shadow' days - the difficult ones - often teach us the most about ourselves. "
    }

    // Analyze reflection sentiment
    if (positiveCount > negativeCount && positiveCount > 0) {
      analysis +=
        "Your reflection carries an underlying current of positivity and gratitude, which suggests you're developing what Jung called a 'transcendent function' - the ability to hold both challenges and growth simultaneously. "
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      analysis +=
        "I notice some challenging emotions in your reflection. Jung believed that our difficult feelings are often messengers, pointing toward aspects of ourselves that need attention or integration. What might these feelings be trying to tell you? "
    } else {
      analysis +=
        "Your reflection shows a balanced, thoughtful approach to processing your day - neither overly optimistic nor pessimistic, but grounded in honest self-observation. "
    }

    // Encouraging conclusion
    analysis +=
      "Remember, the goal isn't perfection but rather what Jung called 'wholeness' - the ongoing process of becoming more fully yourself. Each day of showing up, whether 'successful' or not, is a step toward that authentic self."

    return analysis
  }

  const generateAiResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate contextual responses based on user input
    const messageLower = userMessage.toLowerCase()

    if (messageLower.includes("shadow") || messageLower.includes("difficult") || messageLower.includes("challenge")) {
      return "Jung believed that our shadow - the parts of ourselves we'd rather not acknowledge - contains tremendous energy and wisdom. When we face difficulties, we're often encountering aspects of our shadow that want to be integrated. What feels most challenging about today's experience? Sometimes our resistance points to exactly what we need to explore."
    }

    if (messageLower.includes("goal") || messageLower.includes("purpose") || messageLower.includes("meaning")) {
      return "The question of authentic goals versus inherited expectations is central to individuation. Jung would ask: are these rituals serving your true self, or are they perhaps fulfilling someone else's vision of who you should be? Notice what energizes you versus what feels like obligation. Your authentic path often lies in the direction of what feels most alive, even if it's unconventional."
    }

    if (messageLower.includes("perfect") || messageLower.includes("failure") || messageLower.includes("not enough")) {
      return "Perfectionism often masks a deeper fear of not being acceptable as we are. Jung taught that wholeness includes our imperfections - they're not bugs to be fixed, but features of our unique humanity. What would it feel like to approach your rituals with curiosity rather than judgment? Sometimes our 'failures' teach us more about ourselves than our successes."
    }

    if (messageLower.includes("feeling") || messageLower.includes("emotion") || messageLower.includes("mood")) {
      return "Emotions are the language of the unconscious - they carry information about what matters to us at the deepest level. Jung encouraged us to sit with our feelings rather than immediately trying to change them. What is this feeling trying to tell you? Sometimes the emotion itself is less important than the wisdom it's pointing toward."
    }

    if (messageLower.includes("why") || messageLower.includes("understand") || messageLower.includes("confused")) {
      return "The psyche doesn't always reveal its wisdom through logical understanding. Sometimes we need to sit with the mystery, the not-knowing. Jung called this 'holding the tension of opposites' - being comfortable with questions that don't have immediate answers. What if the confusion itself is pointing toward something important that's trying to emerge?"
    }

    if (messageLower.includes("change") || messageLower.includes("different") || messageLower.includes("better")) {
      return "True change often happens not through force, but through acceptance and understanding. Jung observed that 'what you resist persists, what you accept transforms.' Instead of trying to change yourself, what if you first deeply understood why you are the way you are? Compassionate self-awareness is often the doorway to natural transformation."
    }

    // Default thoughtful response
    const defaultResponses = [
      "That's a profound observation. Jung would say that your willingness to reflect deeply is itself a form of psychological work. What resonates most strongly with you about today's experience?",
      "I hear you exploring something important here. In Jungian terms, this kind of self-inquiry is how we develop a relationship with our unconscious wisdom. What feels most alive or meaningful in what you're sharing?",
      "Your reflection touches on something Jung called 'the transcendent function' - the ability to hold multiple perspectives simultaneously. What would it mean to honor both the part of you that achieved today and the part that might want something different?",
      "Jung believed that our most important insights often come not from analysis, but from simply being present with our experience. As you sit with today's events, what wants your attention most?",
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isAiResponding) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setUserInput("")
    setIsAiResponding(true)

    try {
      const aiResponse = await generateAiResponse(userMessage.content)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error generating AI response:", error)
    } finally {
      setIsAiResponding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return "text-green-400"
    if (rate >= 70) return "text-blue-400"
    if (rate >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-400"
    if (rating >= 3) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("review")}
          className="text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="text-white font-medium text-ios-subhead">Daily Reflection</div>
          <div className="text-[#AEAEB2] text-ios-footnote">AI-powered insights</div>
        </div>
        <div className="w-12" />
      </div>

      {/* Day Summary */}
      <div className="p-4 border-b border-gray-700">
        <div className="ios-card p-4">
          <h2 className="text-white font-bold text-ios-title-3 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
            Today's Summary
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className={cn("text-ios-title-2 font-bold", getCompletionColor(completionRate))}>
                {completionRate}%
              </div>
              <div className="text-ios-footnote text-[#AEAEB2]">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-ios-title-2 font-bold text-blue-400">{completedRituals.length}</div>
              <div className="text-ios-footnote text-[#AEAEB2]">Rituals</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn("w-4 h-4", star <= dayRating ? "text-yellow-400 fill-yellow-400" : "text-gray-500")}
                  />
                ))}
              </div>
              <div className="text-ios-footnote text-[#AEAEB2]">Your Rating</div>
            </div>
          </div>

          {dayReflection && (
            <div className="bg-[#2C2C2E] rounded-lg p-3">
              <h4 className="text-white font-medium text-ios-subhead mb-2">Your Reflection</h4>
              <p className="text-[#AEAEB2] text-ios-subhead leading-relaxed">{dayReflection}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="flex-1 overflow-auto ios-scroll-container">
        <div className="p-4">
          <div className="ios-card p-4">
            <h3 className="text-white font-bold text-ios-title-3 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-400" />
              Jungian Analysis
            </h3>

            {isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-purple-400 text-ios-subhead">Analyzing your day...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#2C2C2E] rounded animate-pulse" />
                  <div className="h-4 bg-[#2C2C2E] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#2C2C2E] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <p className="text-white text-ios-subhead leading-relaxed">{aiAnalysis}</p>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium text-ios-subhead flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                    Key Insights
                  </h4>

                  <div className="space-y-2">
                    {completionRate >= 80 && dayRating <= 2 && (
                      <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-yellow-400 font-medium text-ios-footnote">
                            Completion-Satisfaction Gap
                          </div>
                          <div className="text-[#AEAEB2] text-ios-footnote">
                            High completion but low satisfaction suggests a need to examine your goals
                          </div>
                        </div>
                      </div>
                    )}

                    {completionRate < 60 && dayRating >= 4 && (
                      <div className="flex items-start space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-green-400 font-medium text-ios-footnote">Intuitive Wisdom</div>
                          <div className="text-[#AEAEB2] text-ios-footnote">
                            You found satisfaction beyond task completion - trust this inner knowing
                          </div>
                        </div>
                      </div>
                    )}

                    {completionRate >= 80 && dayRating >= 4 && (
                      <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Star className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-blue-400 font-medium text-ios-footnote">Aligned Day</div>
                          <div className="text-[#AEAEB2] text-ios-footnote">
                            Beautiful harmony between intention and experience
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Toggle Button */}
                {!showChat && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setShowChat(true)}
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Explore this analysis further
                    </Button>
                  </div>
                )}

                {/* Chat Interface */}
                {showChat && (
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <h4 className="text-white font-medium text-ios-subhead mb-3 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2 text-purple-400" />
                      Dialogue with AI
                    </h4>

                    {/* Chat Messages */}
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto ios-scroll-container">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3 text-ios-subhead",
                              message.role === "user"
                                ? "bg-blue-500 text-white"
                                : "bg-purple-500/10 border border-purple-500/30 text-white",
                            )}
                          >
                            <p className="leading-relaxed">{message.content}</p>
                            <div
                              className={cn(
                                "text-ios-caption-1 mt-1 opacity-70",
                                message.role === "user" ? "text-blue-100" : "text-[#AEAEB2]",
                              )}
                            >
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}

                      {isAiResponding && (
                        <div className="flex justify-start">
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                              <div
                                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <div
                                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              />
                              <span className="text-purple-400 text-ios-footnote ml-2">Reflecting...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Share your thoughts or ask a question..."
                        className="flex-1 bg-[#3C3C3E] border-[#4C4C4E] text-white placeholder-[#AEAEB2]"
                        disabled={isAiResponding}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userInput.trim() || isAiResponding}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shutdown Button */}
      {showShutdown && (
        <div className="p-4 border-t border-gray-700">
          <div className="text-center mb-4">
            <p className="text-[#AEAEB2] text-ios-subhead">
              {showChat && chatMessages.length > 0
                ? "When you're ready, complete your daily cycle."
                : "Take a moment to absorb these insights, then complete your daily cycle."}
            </p>
          </div>
          <Button
            onClick={onShutdownComplete}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 font-medium"
          >
            <Power className="w-4 h-4 mr-2" />
            Shutdown Complete
          </Button>
        </div>
      )}
    </div>
  )
}
