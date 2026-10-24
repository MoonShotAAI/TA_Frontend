'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ClipboardList } from 'lucide-react';

export type GradingStep = 1 | 2 | 3 | 4;

interface StepProgressBarProps {
  currentStep: GradingStep;
  progressPercent?: number;
  onStepClick?: (step: GradingStep) => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  progressPercent = 0,
  onStepClick,
}) => {
  const steps = [
    {
      step: 1 as GradingStep,
      title: 'Upload',
      subtitle: 'LMS Batch',
      href: '/upload',
    },
    {
      step: 2 as GradingStep,
      title: 'Configure',
      subtitle: 'Assignment & Rubric',
      href: '/upload?step=2',
    },
    {
      step: 3 as GradingStep,
      title: 'AI Grading',
      subtitle: 'Review & Edit',
      href: '/grading',
    },
    {
      step: 4 as GradingStep,
      title: 'Finalize',
      subtitle: 'Export & Release',
      href: '/confidence',
    },
  ];

  const getStepDescription = (step: GradingStep) => {
    switch (step) {
      case 1:
        return 'Step 1 of 4 - Upload LMS batch to get started';
      case 2:
        return 'Step 2 of 4 - Configure assignment and rubric';
      case 3:
        return 'Step 3 of 4 - Evaluating submissions with AI';
      case 4:
        return 'Step 4 of 4 - Confidence review and TA verification';
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Steps Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 lg:pb-0">
            {steps.map((s, index) => {
              const isCompleted = s.step < currentStep;
              const isCurrent = s.step === currentStep;

              return (
                <React.Fragment key={s.step}>
                  <button
                    onClick={() => onStepClick?.(s.step)}
                    className="flex items-center gap-3 text-left group whitespace-nowrap focus:outline-hidden"
                  >
                    {/* Circle badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-3 ring-blue-100'
                          : isCompleted
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-500 border border-slate-300 group-hover:bg-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.step}
                    </div>

                    {/* Step label */}
                    <div className="leading-tight">
                      <div
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-blue-900'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-500 group-hover:text-slate-700'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{s.subtitle}</div>
                    </div>
                  </button>

                  {/* Divider line between steps */}
                  {index < steps.length - 1 && (
                    <div className="w-8 sm:w-16 h-px bg-slate-200 shrink-0 mx-1" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right: Batch Progress Widget */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 self-start lg:self-auto shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="text-left pr-2">
              <div className="text-[11px] font-semibold text-slate-800">Batch Progress</div>
              <div className="text-[11px] text-slate-700">{getStepDescription(currentStep)}</div>
            </div>
            <div className="pl-3 border-l border-slate-200 font-bold text-sm text-slate-800">
              {progressPercent}%
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
