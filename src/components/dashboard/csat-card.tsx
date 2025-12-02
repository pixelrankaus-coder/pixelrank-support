"use client";

import type { CSATData } from "@/types/dashboard";

// Custom outline smiley icons to match the reference
function PositiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M8 14.5c1 1.5 2.5 2 4 2s3-0.5 4-2" strokeLinecap="round" />
    </svg>
  );
}

function NeutralIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <line x1="8" y1="15" x2="16" y2="15" strokeLinecap="round" />
    </svg>
  );
}

function NegativeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M8 16.5c1-1.5 2.5-2 4-2s3 0.5 4 2" strokeLinecap="round" />
    </svg>
  );
}

interface CSATDonutProps {
  percentage: number;
}

function CSATDonut({ percentage }: CSATDonutProps) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-[80px] h-[80px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#eaecf0"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#17B26A"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold text-[#101828] leading-none">{percentage}%</span>
        <span className="text-[11px] text-[#667085] mt-0.5">CSAT</span>
      </div>
    </div>
  );
}

interface RatingColumnProps {
  icon: React.ReactNode;
  label: string;
  labelColor: string;
  percentage: number;
  count: number;
}

function RatingColumn({ icon, label, labelColor, percentage, count }: RatingColumnProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Row 1: Icon + Label */}
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-[14px] font-medium ${labelColor}`}>{label}</span>
      </div>
      {/* Row 2: Percentage */}
      <span className="text-[28px] font-semibold text-[#101828] mt-2">{percentage}%</span>
      {/* Row 3: Subtext */}
      <span className="text-[13px] text-[#667085] mt-1">{count} Rating</span>
    </div>
  );
}

interface CSATCardProps {
  data: CSATData;
}

export function CSATCard({ data }: CSATCardProps) {
  return (
    <div className="bg-white border border-[#eaecf0] rounded-lg p-6">
      {/* Content: Horizontal layout */}
      <div className="flex items-center justify-between">
        {/* Left: Three rating columns - evenly distributed */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          <RatingColumn
            icon={<PositiveIcon className="w-5 h-5 text-[#17B26A]" />}
            label="Positive"
            labelColor="text-[#17B26A]"
            percentage={data.positive.percentage}
            count={data.positive.count}
          />
          <RatingColumn
            icon={<NeutralIcon className="w-5 h-5 text-[#DC6803]" />}
            label="Neutral"
            labelColor="text-[#DC6803]"
            percentage={data.neutral.percentage}
            count={data.neutral.count}
          />
          <RatingColumn
            icon={<NegativeIcon className="w-5 h-5 text-[#F04438]" />}
            label="Negative"
            labelColor="text-[#F04438]"
            percentage={data.negative.percentage}
            count={data.negative.count}
          />
        </div>

        {/* Right: Donut chart */}
        <CSATDonut percentage={data.overall} />
      </div>
    </div>
  );
}
