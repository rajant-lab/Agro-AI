import { useState, useEffect } from "react";
import { MitigationStep } from "../types";
import { CheckCircle2, Circle, AlertTriangle, ShieldAlert, BookOpen, Check } from "lucide-react";

interface MitigationTimelineProps {
  timeline: MitigationStep[];
}

export function MitigationTimeline({ timeline }: MitigationTimelineProps) {
  // State to track completed defense steps
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Reset completion check when a new timeline is loaded
  useEffect(() => {
    setCompletedSteps({});
  }, [timeline]);

  // Flatten steps to count totals
  const allSubsteps: { parentTitle: string; stepText: string; id: string }[] = [];
  timeline.forEach((milestone, idx) => {
    milestone.steps.forEach((step, stepIdx) => {
      allSubsteps.push({
        parentTitle: milestone.action_title,
        stepText: step,
        id: `${idx}-${stepIdx}`,
      });
    });
  });

  const totalStepsCount = allSubsteps.length;
  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio.toUpperCase()) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50">
            <ShieldAlert size={12} className="text-rose-600 dark:text-rose-400" />
            CRITICAL PRIORITY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
            <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
            MEDIUM PRIORITY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50">
            <BookOpen size={12} className="text-green-600 dark:text-green-400" />
            STANDARD SAFETY
          </span>
        );
    }
  };

  const getTimeframeStyles = (tf: string) => {
    const cleanTf = tf.toLowerCase();
    if (cleanTf.includes("immediate") || cleanTf.includes("24")) {
      return {
        border: "border-rose-200 dark:border-rose-900",
        bg: "bg-gradient-to-r from-rose-500/10 to-transparent",
        iconColor: "text-rose-500",
        pillBg: "bg-rose-600 text-white"
      };
    } else if (cleanTf.includes("short") || cleanTf.includes("48") || cleanTf.includes("72")) {
      return {
        border: "border-amber-200 dark:border-amber-900",
        bg: "bg-gradient-to-r from-amber-500/10 to-transparent",
        iconColor: "text-amber-500",
        pillBg: "bg-amber-500 text-white"
      };
    } else {
      return {
        border: "border-emerald-200 dark:border-emerald-900",
        bg: "bg-gradient-to-r from-emerald-500/10 to-transparent",
        iconColor: "text-emerald-500",
        pillBg: "bg-emerald-600 text-white"
      };
    }
  };

  return (
    <div className="space-y-6" id="mitigation-timeline-widget">
      {/* Dynamic Checklist Aggregated Progress */}
      {totalStepsCount > 0 && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-xl p-5 shadow-sm border border-zinc-800" id="mitigation-meter">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div>
              <p className="text-xs text-zinc-400 font-medium tracking-wider uppercase">Active Countermeasures Tracker</p>
              <h4 className="text-base font-semibold">Agricultural Task Completion Meter</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {progressPercent}%
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">
                {completedStepsCount} of {totalStepsCount} actions applied
              </p>
            </div>
          </div>
          
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-zinc-400 mt-2.5 flex items-center gap-1.5 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            Check off steps below as you execute field mitigation procedures to optimize harvest defense.
          </p>
        </div>
      )}

      {/* Task Milestones Cards */}
      <div className="space-y-5">
        {timeline.map((milestone, idx) => {
          const tfStyle = getTimeframeStyles(milestone.timeframe);
          return (
            <div 
              key={idx}
              className={`rounded-xl border ${tfStyle.border} bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Header */}
              <div className={`p-4 ${tfStyle.bg} border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${tfStyle.pillBg}`}>
                    {milestone.timeframe}
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                    {milestone.action_title}
                  </h4>
                </div>
                <div>{getPriorityBadge(milestone.priority)}</div>
              </div>

              {/* Rationale description */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans flex items-start gap-2.5">
                <span className={`font-mono font-bold shrink-0 mt-0.5 ${tfStyle.iconColor}`}>[Rationale]</span>
                <p>{milestone.rationale}</p>
              </div>

              {/* Step Checklist Table */}
              <div className="p-4 bg-white dark:bg-zinc-900">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 block">Mitigation Step Sequence</p>
                <div className="space-y-2.5">
                  {milestone.steps.map((step, stepIdx) => {
                    const stepId = `${idx}-${stepIdx}`;
                    const isChecked = !!completedSteps[stepId];
                    return (
                      <div 
                        key={stepIdx}
                        onClick={() => toggleStep(stepId)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked 
                            ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-800/40 text-zinc-400 dark:text-zinc-500" 
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50 dark:bg-zinc-800/40 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <button 
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <div className="flex-1 text-xs leading-relaxed font-sans">
                          {isChecked ? (
                            <del className="line-through text-zinc-400 dark:text-zinc-500 transition-all">{step}</del>
                          ) : (
                            step
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
