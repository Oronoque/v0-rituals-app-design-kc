// import type { Ritual } from "@/app/types"
// import { generateMockMetrics, generateRitualMetrics } from "@/app/utils/metrics"

// export const createMockRituals = (): Ritual[] => {
//   const rituals: Ritual[] = [
//     {
//       id: "1",
//       name: "Morning Routine",
//       scheduledTime: "06:00",
//       location: "Bedroom & Kitchen",
//       gear: ["Towel", "Journal"],
//       category: "Wellness",
//       steps: [
//         {
//           id: "1-1",
//           type: "yesno",
//           name: "Take a cold shower",
//           completed: false,
//           metrics: generateMockMetrics("yesno", "1-1"),
//         },
//         {
//           id: "1-2",
//           type: "qa",
//           name: "Gratitude",
//           question: "What am I grateful for today?",
//           completed: false,
//           metrics: generateMockMetrics("qa", "1-2"),
//         },
//         {
//           id: "1-3",
//           type: "yesno",
//           name: "Get sunlight",
//           completed: false,
//           metrics: generateMockMetrics("yesno", "1-3"),
//         },
//         {
//           id: "1-4",
//           type: "yesno",
//           name: "Meditate 10 minutes",
//           completed: false,
//           metrics: generateMockMetrics("yesno", "1-4"),
//         },
//       ],
//       completed: false,
//     },
//     {
//       id: "2",
//       name: "Workout",
//       scheduledTime: "08:00",
//       location: "Home Gym",
//       gear: ["Dumbbells", "Yoga Mat"],
//       category: "Fitness",
//       steps: [
//         {
//           id: "2-1",
//           type: "yesno",
//           name: "Warm up",
//           completed: false,
//           metrics: generateMockMetrics("yesno", "2-1"),
//         },
//         {
//           id: "2-2",
//           type: "weightlifting",
//           name: "Dumbbell Bench Press",
//           completed: false,
//           weightliftingConfig: [
//             { reps: 12, weight: 25 },
//             { reps: 10, weight: 30 },
//             { reps: 8, weight: 35 },
//           ],
//           metrics: generateMockMetrics("weightlifting", "2-2"),
//         },
//         {
//           id: "2-3",
//           type: "weightlifting",
//           name: "Squats",
//           completed: false,
//           weightliftingConfig: [
//             { reps: 15, weight: 135 },
//             { reps: 12, weight: 155 },
//             { reps: 10, weight: 175 },
//           ],
//           metrics: generateMockMetrics("weightlifting", "2-3"),
//         },
//         {
//           id: "2-4",
//           type: "cardio",
//           name: "Treadmill",
//           completed: false,
//           cardioConfig: [{ time: 30, distance: 3.0 }],
//           metrics: generateMockMetrics("cardio", "2-4"),
//         },
//       ],
//       completed: false,
//     },
//     {
//       id: "3",
//       name: "Evening Reflection",
//       scheduledTime: "21:00",
//       location: "Living Room",
//       gear: ["Journal", "Tea"],
//       category: "Wellness",
//       steps: [
//         {
//           id: "3-1",
//           type: "qa",
//           name: "Daily Review",
//           question: "What's one thing I'm proud of today?",
//           completed: false,
//           metrics: generateMockMetrics("qa", "3-1"),
//         },
//         {
//           id: "3-2",
//           type: "qa",
//           name: "Tomorrow's Focus",
//           question: "What's my main priority for tomorrow?",
//           completed: false,
//           metrics: generateMockMetrics("qa", "3-2"),
//         },
//         {
//           id: "3-3",
//           type: "yesno",
//           name: "Read for 20 minutes",
//           completed: false,
//           metrics: generateMockMetrics("yesno", "3-3"),
//         },
//       ],
//       completed: false,
//     },
//   ]

//   // Add metrics to rituals
//   rituals.forEach((ritual) => {
//     ritual.metrics = generateRitualMetrics(ritual)
//   })

//   return rituals
// }
