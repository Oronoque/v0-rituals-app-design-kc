// "use client";
// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   ArrowLeft,
//   Check,
//   BarChart3,
//   Calendar,
//   ChevronDown,
//   ChevronUp,
//   Clock,
//   List,
//   Loader2,
// } from "lucide-react";
// import { AnimatedCheckbox } from "@/app/components/ui/animated-checkbox";
// import { BottomNavigation } from "@/app/components/ui/bottom-navigation";
// import { cn } from "@/lib/utils";
// import { FlowState } from "../types";
// import { 
//   useDailyRitualsByDate, 
//   useUpdateDailyRitual 
// } from "@/hooks/use-api";
// import type { 
//   DailyRitualResponse 
// } from "@/backend/src/types/api";
// import type { 
//   StepInstanceWithData
// } from "@/backend/src/types/database";

// interface DayFlowScreenV3Props {
//   onNavigate: (flow: FlowState) => void;
// }

// export function DayFlowScreenV3({ onNavigate }: DayFlowScreenV3Props) {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [activeStepInstanceId, setActiveStepInstanceId] = useState<string | null>(null);
//   const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

//   const dateString = selectedDate.toISOString().split('T')[0];
  
//   // Fetch daily rituals for the selected date
//   const { 
//     data: dailyRitualsData, 
//     isLoading, 
//     error,
//     refetch 
//   } = useDailyRitualsByDate(dateString);

//   console.log(dailyRitualsData); 
//   const { mutate: updateDailyRitual } = useUpdateDailyRitual();

//   const dailyRituals = dailyRitualsData?.dailyRituals || [];

//   // Find the next incomplete step and make it active
//   useEffect(() => {
//     if (!dailyRituals.length) return;

//     for (const dailyRitual of dailyRituals) {
//       if (dailyRitual.completed_at) continue;

//       const nextIncompleteStep = dailyRitual.step_instances?.find(
//         (stepInstance) => stepInstance.status !== "completed"
//       );

//       if (nextIncompleteStep) {
//         setActiveStepInstanceId(nextIncompleteStep.id);
        
//         // Auto-expand complex step types
//         if (nextIncompleteStep.snapshot.type === "qna" || 
//             nextIncompleteStep.snapshot.type === "exercise_set") {
//           setExpandedSteps(prev => new Set([...prev, nextIncompleteStep.id]));
//         }
//         break;
//       }
//     }
//   }, [dailyRituals]);

//   // Generate week days for date selector
//   const getWeekDays = () => {
//     const today = new Date();
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - today.getDay());

//     return Array.from({ length: 7 }, (_, i) => {
//       const date = new Date(startOfWeek);
//       date.setDate(startOfWeek.getDate() + i);
//       return date;
//     });
//   };

//   const weekDays = getWeekDays();

//   const handleStepUpdate = (stepInstanceId: string, completed: boolean) => {
//     // Find the daily ritual containing this step
//     const dailyRitual = dailyRituals.find(dr => 
//       dr.step_instances?.some(si => si.id === stepInstanceId)
//     );

//     if (!dailyRitual) return;

//     // Update via API - in a real implementation, this would update the step instance
//     updateDailyRitual({
//       id: dailyRitual.id,
//       updates: {
//         notes: `Step updated at ${new Date().toISOString()}`
//       }
//     }, {
//       onSuccess: () => {
//         // Find and activate the next incomplete step
//         setTimeout(() => {
//           for (const dr of dailyRituals) {
//             if (dr.completed_at) continue;

//             const nextIncompleteStep = dr.step_instances?.find(
//               (si) => si.id !== stepInstanceId && si.status !== "completed"
//             );

//             if (nextIncompleteStep) {
//               setActiveStepInstanceId(nextIncompleteStep.id);
              
//               // Auto-expand complex step types
//               if (nextIncompleteStep.snapshot.type === "qna" || 
//                   nextIncompleteStep.snapshot.type === "exercise_set") {
//                 setExpandedSteps(prev => new Set([...prev, nextIncompleteStep.id]));
//               }
//               break;
//             }
//           }
//         }, 300);
//       }
//     });
//   };

//   const toggleStepExpanded = (stepInstanceId: string) => {
//     const newExpanded = new Set(expandedSteps);
//     if (newExpanded.has(stepInstanceId)) {
//       newExpanded.delete(stepInstanceId);
//     } else {
//       newExpanded.add(stepInstanceId);
//     }
//     setExpandedSteps(newExpanded);
//   };

//   const isStepCompleted = (stepInstance: StepInstanceWithData): boolean => {
//     return stepInstance.status === "completed";
//   };

//   const getStepContainerClasses = (stepInstance: StepInstanceWithData) => {
//     const isCompleted = isStepCompleted(stepInstance);
//     const isActive = activeStepInstanceId === stepInstance.id;

//     return cn(
//       "ios-card mb-3 transition-all duration-300",
//       isCompleted && "border-green-500/30 bg-green-500/5",
//       isActive && !isCompleted && "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20",
//       !isActive && !isCompleted && "border-gray-600/30",
//     );
//   };

//   const renderStepContent = (stepInstance: StepInstanceWithData, dailyRitual: DailyRitualResponse) => {
//     const isExpanded = expandedSteps.has(stepInstance.id);
//     const isActive = activeStepInstanceId === stepInstance.id;
//     const isCompleted = isStepCompleted(stepInstance);
//     const step = stepInstance.snapshot;

//     switch (step.type) {
//       case "boolean":
//         return (
//           <div className={getStepContainerClasses(stepInstance)}>
//             <div className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3 flex-1">
//                   <AnimatedCheckbox
//                     isCompleted={isCompleted}
//                     onComplete={() => handleStepUpdate(stepInstance.id, !isCompleted)}
//                     size="medium"
//                   />
//                   <div className="flex-1">
//                     <h3
//                       className={cn(
//                         "font-medium text-ios-subhead transition-colors",
//                         isActive ? "text-blue-400" : "text-white",
//                       )}
//                     >
//                       {step.name}
//                     </h3>
//                     {step.description && (
//                       <p className="text-[#AEAEB2] text-ios-footnote mt-1">
//                         {step.description}
//                       </p>
//                     )}
//                     {isActive && !isCompleted && (
//                       <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">
//                         👆 Tap to complete
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => {}} // Could show metrics
//                   className="text-[#AEAEB2] hover:text-blue-400 p-1"
//                 >
//                   <BarChart3 className="w-4 h-4" />
//                 </Button>
//               </div>
//             </div>
//           </div>
//         );

//       case "qna":
//         return (
//           <div className={getStepContainerClasses(stepInstance)}>
//             <div className="p-4">
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-start space-x-3 flex-1">
//                   <div className="mt-1">
//                     <AnimatedCheckbox
//                       isCompleted={isCompleted}
//                       onComplete={() => toggleStepExpanded(stepInstance.id)}
//                       size="medium"
//                     />
//                   </div>
//                   <div className="flex-1">
//                     <h3
//                       className={cn(
//                         "font-medium text-ios-subhead transition-colors",
//                         isActive ? "text-blue-400" : "text-white",
//                       )}
//                     >
//                       {step.name}
//                     </h3>
//                     {step.description && (
//                       <p className="text-[#AEAEB2] text-ios-footnote mt-1">
//                         {step.description}
//                       </p>
//                     )}
//                     {isActive && !isCompleted && (
//                       <p className="text-blue-400 text-ios-footnote mt-1 animate-pulse">
//                         ✍️ Ready for your answer
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => {}} // Could show metrics
//                     className="text-[#AEAEB2] hover:text-blue-400 p-1"
//                   >
//                     <BarChart3 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => toggleStepExpanded(stepInstance.id)}
//                     className="text-[#AEAEB2] hover:text-white p-1"
//                   >
//                     {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//                   </Button>
//                 </div>
//               </div>

//               {isExpanded && (
//                 <div className="mt-3 animate-ios-fade-in">
//                   <Textarea
//                     placeholder="Type your answer here..."
//                     onChange={(e) => {
//                       // In a real implementation, this would update the step response
//                       if (e.target.value.length > 10) {
//                         handleStepUpdate(stepInstance.id, true);
//                       }
//                     }}
//                     className={cn(
//                       "min-h-24 border rounded-lg resize-none transition-all duration-200",
//                       isActive
//                         ? "bg-blue-500/10 border-blue-500/50 text-white placeholder-blue-300/70 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
//                         : "bg-[#3C3C3E] border-[#4C4C4E] text-white placeholder-[#AEAEB2]",
//                     )}
//                     autoFocus={isActive && !isCompleted}
//                   />
//                   {isCompleted && (
//                     <div className="flex items-center text-green-400 text-ios-footnote mt-2">
//                       <Check className="w-3 h-3 mr-1" />
//                       Answer saved
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         );

//       case "counter":
//         return (
//           <div className={getStepContainerClasses(stepInstance)}>
//             <div className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3 flex-1">
//                   <AnimatedCheckbox
//                     isCompleted={isCompleted}
//                     onComplete={() => {}} // Counter doesn't toggle like boolean
//                     size="medium"
//                   />
//                   <div className="flex-1">
//                     <h3
//                       className={cn(
//                         "font-medium text-ios-subhead transition-colors",
//                         isActive ? "text-blue-400" : "text-white",
//                       )}
//                     >
//                       {step.name}
//                     </h3>
//                     {step.description && (
//                       <p className="text-[#AEAEB2] text-ios-footnote mt-1">
//                         {step.description}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Input
//                     type="number"
//                     onChange={(e) => {
//                       const value = parseInt(e.target.value) || 0;
//                       if (value > 0) {
//                         handleStepUpdate(stepInstance.id, true);
//                       }
//                     }}
//                     className="w-20 bg-[#2C2C2E] border-[#3C3C3E] text-white text-center"
//                     placeholder="0"
//                   />
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => {}} // Could show metrics
//                     className="text-[#AEAEB2] hover:text-blue-400 p-1"
//                   >
//                     <BarChart3 className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return (
//           <div className={getStepContainerClasses(stepInstance)}>
//             <div className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3 flex-1">
//                   <AnimatedCheckbox
//                     isCompleted={isCompleted}
//                     onComplete={() => handleStepUpdate(stepInstance.id, !isCompleted)}
//                     size="medium"
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-medium text-ios-subhead text-white">
//                       {step.name}
//                     </h3>
//                     <p className="text-[#AEAEB2] text-ios-footnote mt-1">
//                       Step type: {step.type}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
//             <h2 className="text-ios-title-2 font-bold mb-2">Loading Your Day</h2>
//             <p className="text-[#AEAEB2] text-ios-body">
//               Fetching your rituals for {selectedDate.toLocaleDateString()}
//             </p>
//           </div>
//         </div>
//         <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <div className="text-6xl mb-4">⚠️</div>
//             <h2 className="text-ios-title-2 font-bold mb-2">Something went wrong</h2>
//             <p className="text-[#AEAEB2] text-ios-body mb-6">
//               We couldn't load your rituals. Please try again.
//             </p>
//             <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600">
//               Try Again
//             </Button>
//           </div>
//         </div>
//         <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
//       </div>
//     );
//   }

//   if (!dailyRituals.length) {
//     return (
//       <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <div className="text-6xl mb-4">🌊</div>
//             <h2 className="text-ios-title-2 font-bold mb-2">No Rituals Scheduled</h2>
//             <p className="text-[#AEAEB2] text-ios-body mb-6">
//               You don't have any rituals scheduled for {selectedDate.toLocaleDateString()}
//             </p>
//             <Button onClick={() => onNavigate("home")} className="bg-blue-500 hover:bg-blue-600">
//               Go to Home
//             </Button>
//           </div>
//         </div>
//         <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
//       </div>
//     );
//   }

//   const totalSteps = dailyRituals.reduce((sum, dr) => sum + (dr.step_instances?.length || 0), 0);
//   const completedSteps = dailyRituals.reduce(
//     (sum, dr) => sum + (dr.step_instances?.filter(si => si.status === "completed").length || 0), 
//     0
//   );
//   const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

//   return (
//     <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col ios-safe-area">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b border-gray-700">
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => onNavigate("home")}
//           className="text-blue-400 hover:text-blue-300"
//         >
//           <ArrowLeft className="w-5 h-5" />
//         </Button>
//         <div className="text-center">
//           <div className="text-white font-medium text-ios-subhead">Your Day Flow</div>
//           <div className="text-[#AEAEB2] text-ios-footnote">
//             {completedSteps} of {totalSteps} steps completed
//           </div>
//         </div>
//         <div className="w-10" />
//       </div>

//       {/* Date Selector */}
//       <div className="p-4 border-b border-gray-700">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-white font-medium text-ios-subhead">
//             {selectedDate.toDateString() === new Date().toDateString() ? "Today" : selectedDate.toLocaleDateString()}
//           </h3>
//           <Button variant="ghost" size="sm" className="text-blue-400">
//             <Calendar className="w-4 h-4 mr-2" />
//             {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
//           </Button>
//         </div>

//         <div className="flex justify-between">
//           {weekDays.map((date, index) => {
//             const isToday = date.toDateString() === new Date().toDateString();
//             const isSelected = date.toDateString() === selectedDate.toDateString();

//             return (
//               <Button
//                 key={index}
//                 variant="ghost"
//                 onClick={() => setSelectedDate(date)}
//                 className={cn(
//                   "flex flex-col items-center p-2 rounded-lg transition-colors",
//                   isSelected
//                     ? "bg-blue-500 text-white"
//                     : isToday
//                       ? "bg-blue-500/20 text-blue-400"
//                       : "text-[#AEAEB2] hover:text-white",
//                 )}
//               >
//                 <span className="text-ios-footnote">
//                   {date.toLocaleDateString("en-US", { weekday: "short" })}
//                 </span>
//                 <span className="text-ios-subhead font-medium">{date.getDate()}</span>
//               </Button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div className="px-4 py-3 border-b border-gray-700">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-ios-footnote text-[#AEAEB2]">Overall Progress</span>
//           <span className="text-ios-footnote text-[#AEAEB2]">{Math.round(progressPercentage)}%</span>
//         </div>
//         <div className="w-full bg-[#2C2C2E] rounded-full h-2">
//           <div
//             className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//             style={{ width: `${progressPercentage}%` }}
//           />
//         </div>
//       </div>

//       {/* Daily Rituals and Steps */}
//       <div className="flex-1 overflow-auto ios-scroll-container">
//         <div className="p-4 space-y-6">
//           {dailyRituals.map((dailyRitual, ritualIndex) => (
//             <div key={dailyRitual.id} className="space-y-3">
//               {/* Ritual Header */}
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-white font-semibold text-ios-subhead">
//                     {dailyRitual.ritual_snapshot?.name || "Untitled Ritual"}
//                   </h3>
//                   <div className="flex items-center space-x-4 text-[#AEAEB2] text-ios-footnote">
//                     {dailyRitual.scheduled_time && (
//                       <div className="flex items-center space-x-1">
//                         <Clock className="w-3 h-3" />
//                         <span>{dailyRitual.scheduled_time}</span>
//                       </div>
//                     )}
//                     <span>
//                       {dailyRitual.step_instances?.filter(si => si.status === "completed").length || 0} / {dailyRitual.step_instances?.length || 0} steps
//                     </span>
//                   </div>
//                 </div>
//                 {dailyRitual.completed_at && (
//                   <Check className="w-6 h-6 text-green-400" />
//                 )}
//               </div>

//               {/* Steps */}
//               {dailyRitual.step_instances?.map((stepInstance) => (
//                 <div key={stepInstance.id}>
//                   {renderStepContent(stepInstance, dailyRitual)}
//                 </div>
//               ))}
//             </div>
//           ))}
//         </div>
//       </div>

//       <BottomNavigation currentFlow="dayflow" onNavigate={onNavigate} />
//     </div>
//   );
// } 