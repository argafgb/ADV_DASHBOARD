"use client";

import React from "react";
import {
  LayoutGrid,
  Layers,
  Gauge,
  Folder,
  PieChart,
  Settings,
  HelpCircle,
  Inbox,
  Play,
  CheckSquare,
  Activity,
  Pause,
  Search,
  Eye,
  X,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Check,
  Percent,
  Info,
  ClipboardList,
  Star,
  CheckCircle2,
} from "lucide-react";
import { getStatusPalette } from "../utils/status-style";

// ---- Dynamic Icon Component maps original strings ----
interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "w-4 h-4" }: IconProps) {
  switch (name.trim().toLowerCase()) {
    case "grid":
      return <LayoutGrid className={className} />;
    case "layers":
      return <Layers className={className} />;
    case "gauge":
      return <Gauge className={className} />;
    case "folder":
      return <Folder className={className} />;
    case "pie":
      return <PieChart className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "help":
      return <HelpCircle className={className} />;
    case "inbox":
      return <Inbox className={className} />;
    case "play":
      return <Play className={className} />;
    case "check":
      return <Check className={className} />;
    case "checksquare":
    case "check-square":
      return <CheckSquare className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "pause":
      return <Pause className={className} />;
    case "search":
      return <Search className={className} />;
    case "eye":
      return <Eye className={className} />;
    case "x":
      return <X className={className} />;
    case "download":
      return <Download className={className} />;
    case "upload":
      return <Upload className={className} />;
    case "chevron":
    case "chevron-right":
      return <ChevronRight className={className} />;
    case "chevron-left":
      return <ChevronLeft className={className} />;
    case "chevron-up":
      return <ChevronUp className={className} />;
    case "chevron-down":
      return <ChevronDown className={className} />;
    case "warn":
    case "warning":
      return <AlertTriangle className={className} />;
    case "users":
      return <Users className={className} />;
    case "calendar":
      return <Calendar className={className} />;
    case "clock":
      return <Clock className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "percent":
      return <Percent className={className} />;
    case "info":
      return <Info className={className} />;
    case "clipboard":
      return <ClipboardList className={className} />;
    case "star":
      return <Star className={className} />;
    case "checkcircle":
    case "check-circle":
      return <CheckCircle2 className={className} />;
    default:
      return <Folder className={className} />;
  }
}

// ---- Pill (Status badge) ----
interface PillProps {
  label: string;
  /**
   * Nilai mentah kolom `Last Status`. Warnanya diambil dari palet status
   * bersama supaya satu status memakai warna yang sama di seluruh dashboard,
   * termasuk legend Status Distribution.
   */
  status?: unknown;
}

export function Pill({ label, status }: PillProps) {
  const currentClass = getStatusPalette(status).pill;
  return (
    <span
      className={`inline-flex max-w-[132px] items-center rounded-md border px-2 py-1 text-center text-[10px] font-semibold leading-[1.25] ${currentClass}`}
    >
      {label}
    </span>
  );
}

// ---- Card Wrapper ----
interface CardProps {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
  padding?: string;
  onClick?: () => void;
}

export function Card({
  title,
  sub,
  children,
  rightElement,
  className = "",
  padding = "p-5",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`min-w-0 bg-white rounded-[14px] border border-[#E8EBF0] overflow-hidden flex flex-col ${className}`}
    >
      {(title || rightElement) && (
        <div className="border-b border-[#F1F3F7] px-4 py-3.5 sm:px-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 font-sans tracking-tight">
                {title}
              </h3>
            )}
            {sub && (
              <p className="text-xs text-gray-500 font-sans mt-0.5">{sub}</p>
            )}
          </div>
          {rightElement && (
            <div className="max-w-full sm:flex-shrink-0">{rightElement}</div>
          )}
        </div>
      )}
      <div className={`${padding} min-w-0 flex-1 flex flex-col justify-start`}>
        {children}
      </div>
    </div>
  );
}

// ---- Chip stats header component ----
interface ChipRowProps {
  chips: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
  }[];
  activeFilter?: string;
  onFilterChange?: (lbl: string) => void;
}

export function ChipRow({ chips, activeFilter, onFilterChange }: ChipRowProps) {
  const getBorderColor = (col: string, isActive: boolean) => {
    if (!isActive) return "border-[#E8EBF0] bg-white hover:border-[#C7D7FB]";
    if (col === "green") return "border-emerald-300 bg-emerald-50/30";
    if (col === "amber") return "border-amber-300 bg-amber-50/30";
    if (col === "red") return "border-rose-300 bg-rose-50/30";
    return "border-blue-300 bg-blue-50/30";
  };

  const getTextColor = (col: string, isActive: boolean) => {
    if (!isActive) return "text-gray-900";
    if (col === "green") return "text-emerald-700";
    if (col === "amber") return "text-amber-700";
    if (col === "red") return "text-rose-700";
    return "text-blue-700";
  };

  const getIconColor = (col: string) => {
    if (col === "green") return "text-emerald-500";
    if (col === "amber") return "text-amber-500";
    if (col === "red") return "text-rose-500";
    return "text-blue-500";
  };

  // Columns follow the chip count so the row never leaves an empty slot.
  // Tailwind needs literal class names, so the variants are spelled out.
  const columnClass =
    { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" }[
      chips.length
    ] ?? "md:grid-cols-4";

  return (
    <div className={`grid grid-cols-2 ${columnClass} gap-3.5 mb-5 select-none`}>
      {chips.map((c, i) => {
        const isClickable = !!onFilterChange;
        const isActive = activeFilter === c.label;
        return (
          <div
            key={i}
            onClick={() => isClickable && onFilterChange?.(c.label)}
            className={`border rounded-[14px] p-4 flex items-center justify-between transition-all duration-150 ${getBorderColor(c.color, isActive)} ${isClickable ? "cursor-pointer hover:shadow-[0_3px_10px_rgba(17,24,39,0.06)] active:scale-[99%]" : ""}`}
          >
            <div>
              <div className="text-xs text-gray-500 font-medium font-sans">
                {c.label}
              </div>
              <div
                className={`text-3xl font-semibold tabular-nums tracking-tight mt-1 ${getTextColor(c.color, isActive)}`}
              >
                {c.value}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-[10px] bg-gray-50/80 ${getIconColor(c.color)}`}
            >
              <Icon name={c.icon} className="w-5 h-5 stroke-[1.8px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
