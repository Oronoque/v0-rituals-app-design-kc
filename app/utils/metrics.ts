import type { Ritual, Step, StepMetrics, RitualMetrics } from "@/app/types"

export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 1) return weight
  return Math.round(weight / (1.0278 - 0.0278 * reps))
}

export const calculateStreak = (
  history: Array<{ date: string; completed: boolean }>,
): { current: number; longest: number } => {
  if (history.length === 0) return { current: 0, longest: 0 }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  for (const entry of sortedHistory) {
    if (entry.completed) {
      currentStreak++
    } else {
      break
    }
  }

  for (const entry of history) {
    if (entry.completed) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return { current: currentStreak, longest: longestStreak }
}

export const generateMockMetrics = (stepType: string, stepId: string): StepMetrics => {
  const now = new Date()
  const history = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const completed = Math.random() > 0.25

    let answer
    if (stepType === "qa") {
      const answers = [
        "Feeling great today! Made good progress on my goals.",
        "Had some challenges but pushed through and learned a lot.",
        "Excellent day for reflection and planning ahead.",
        "Discovered new insights about myself and my habits.",
        "Grateful for the opportunity to grow and improve.",
      ]
      answer = completed ? answers[Math.floor(Math.random() * answers.length)] : undefined
    }

    return { date: date.toISOString(), completed, answer }
  }).reverse()

  const streaks = calculateStreak(history)
  const completionRate = Math.round((history.filter((h) => h.completed).length / history.length) * 100)

  const baseMetrics: StepMetrics = {
    completionHistory: history,
    totalCompletions: history.filter((h) => h.completed).length,
    completionRate,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  }

  if (stepType === "weightlifting") {
    const fitnessData = {
      volume: history
        .filter((h) => h.completed)
        .map((h, i) => ({
          date: h.date,
          totalWeight: Math.floor(Math.random() * 3000) + 2000 + i * 50,
          totalReps: Math.floor(Math.random() * 30) + 25 + i,
        })),
      maxWeights: history
        .filter((h) => h.completed)
        .map((h, i) => ({
          date: h.date,
          weight: 135 + i * 2.5 + Math.floor(Math.random() * 10),
          reps: Math.floor(Math.random() * 8) + 1,
        })),
      personalRecords: [],
    }

    fitnessData.personalRecords = fitnessData.maxWeights
      .filter((_, i) => i % 5 === 0)
      .map((record) => ({
        ...record,
        oneRepMax: calculateOneRepMax(record.weight, record.reps),
      }))

    baseMetrics.fitnessData = fitnessData
    baseMetrics.personalBest = Math.max(...fitnessData.personalRecords.map((pr) => pr.oneRepMax))
  }

  return baseMetrics
}

export const generateRitualMetrics = (ritual: Ritual): RitualMetrics => {
  const now = new Date()
  const history = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const completed = Math.random() > 0.2
    const completionRate = Math.floor(Math.random() * 40) + 60

    return { date: date.toISOString(), completed, completionRate }
  }).reverse()

  const streaks = calculateStreak(history.map((h) => ({ date: h.date, completed: h.completed })))
  const completionRate = Math.round((history.filter((h) => h.completed).length / history.length) * 100)

  return {
    completionHistory: history,
    totalCompletions: history.filter((h) => h.completed).length,
    completionRate,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    averageCompletionTime: Math.floor(Math.random() * 20) + 10,
    stepMetrics: {},
  }
}

export const generateRitualMetricsData = (ritual: Ritual) => ({
  summary: {
    totalCompletions: ritual.metrics?.totalCompletions || Math.floor(Math.random() * 50) + 20,
    completionRate: ritual.metrics?.completionRate || Math.floor(Math.random() * 40) + 60,
    currentStreak: ritual.metrics?.currentStreak || Math.floor(Math.random() * 15) + 1,
    longestStreak: ritual.metrics?.longestStreak || Math.floor(Math.random() * 25) + 5,
    trend: "up" as const,
    trendPercentage: Math.floor(Math.random() * 20) + 5,
  },
  completionHistory: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return {
      date: date.toISOString(),
      value: Math.random() > 0.3 ? 100 : 0,
    }
  }).reverse(),
})

export const generateStepMetricsData = (step: Step) => {
  const baseData = {
    summary: {
      totalCompletions: step.metrics?.totalCompletions || Math.floor(Math.random() * 40) + 15,
      completionRate: step.metrics?.completionRate || Math.floor(Math.random() * 35) + 65,
      currentStreak: step.metrics?.currentStreak || Math.floor(Math.random() * 10) + 1,
      longestStreak: step.metrics?.longestStreak || Math.floor(Math.random() * 20) + 3,
      personalBest: step.type === "weightlifting" ? Math.floor(Math.random() * 100) + 150 : undefined,
      trend: Math.random() > 0.5 ? "up" : ("stable" as const),
      trendPercentage: Math.floor(Math.random() * 15) + 2,
    },
    completionHistory: Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString(),
        value: Math.random() > 0.25 ? 100 : 0,
      }
    }).reverse(),
  }

  if (step.type === "qa") {
    return {
      ...baseData,
      answerHistory: Array.from({ length: 10 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const answers = [
          "Feeling motivated and focused today.",
          "Learning new techniques and strategies.",
          "Making steady progress on my goals.",
        ]
        return {
          date: date.toISOString(),
          answer: answers[Math.floor(Math.random() * answers.length)],
        }
      }).reverse(),
    }
  }

  if (step.type === "weightlifting") {
    return {
      ...baseData,
      fitnessHistory: {
        volume: Array.from({ length: 20 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i)
          return {
            date: date.toISOString(),
            value: 2000 + i * 50 + Math.random() * 500,
          }
        }).reverse(),
        maxWeight: Array.from({ length: 20 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i)
          return {
            date: date.toISOString(),
            value: 135 + i * 2.5 + Math.random() * 10,
          }
        }).reverse(),
        oneRepMax: Array.from({ length: 20 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i)
          return {
            date: date.toISOString(),
            value: 180 + i * 3 + Math.random() * 15,
          }
        }).reverse(),
        personalRecords: Array.from({ length: 5 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i * 7)
          return {
            date: date.toISOString(),
            reps: 8 - i,
            weight: 200 + i * 5,
          }
        }).reverse(),
      },
    }
  }

  return baseData
}
