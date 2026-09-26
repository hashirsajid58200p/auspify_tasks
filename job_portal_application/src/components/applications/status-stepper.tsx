import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ApplicationStatus =
  "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";

interface StatusStepperProps {
  status: ApplicationStatus;
  statusHistory?: {
    status: ApplicationStatus;
    changedAt: Date | string;
  }[];
}

const ORDERED_STEPS: { key: ApplicationStatus; label: string; desc: string }[] = [
  { key: "SUBMITTED", label: "Submitted", desc: "Application received" },
  { key: "UNDER_REVIEW", label: "Under Review", desc: "Screening credentials" },
  { key: "SHORTLISTED", label: "Shortlisted", desc: "Selected for review" },
  { key: "INTERVIEW", label: "Interview", desc: "Interview stage" },
  { key: "OFFERED", label: "Offered", desc: "Offer extended" },
];

export function StatusStepper({ status, statusHistory = [] }: StatusStepperProps) {
  const isTerminalNegative = status === "REJECTED" || status === "WITHDRAWN";

  const currentStepIndex = ORDERED_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-6">
      {/* Terminal Negative Alert if rejected or withdrawn */}
      {status === "REJECTED" && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 font-bold text-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>This application was not selected to move forward.</span>
        </div>
      )}

      {status === "WITHDRAWN" && (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 border-2 border-black rounded-2xl flex items-center gap-3 text-neutral-700 dark:text-neutral-300 font-bold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-muted-foreground" />
          <span>You withdrew this application. No further action is pending.</span>
        </div>
      )}

      {/* Stepper container: vertical stack on mobile, horizontal flow on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {ORDERED_STEPS.map((step, idx) => {
          const isPassed = !isTerminalNegative && currentStepIndex >= idx;
          const isCurrent = !isTerminalNegative && currentStepIndex === idx;

          let cardBg =
            "bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700";
          let stepNumberBg = "bg-neutral-200 dark:bg-neutral-800 text-neutral-500";

          if (isCurrent) {
            cardBg = "bg-[#FFE500] text-black border-black shadow-neo-sm";
            stepNumberBg = "bg-black text-white";
          } else if (isPassed) {
            cardBg = "bg-white dark:bg-[#191919] border-black shadow-neo-sm";
            stepNumberBg = "bg-[#10B981] text-white";
          }

          const historyItem = statusHistory.find((h) => h.status === step.key);

          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  Step {idx + 1}
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${stepNumberBg}`}
                >
                  {isPassed && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm leading-tight">{step.label}</h4>
                <p className="text-[11px] opacity-80 font-medium">{step.desc}</p>
              </div>

              {historyItem && (
                <div className="text-[10px] font-semibold opacity-70 flex items-center gap-1 pt-1 border-t border-black/10 dark:border-white/10">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(historyItem.changedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
