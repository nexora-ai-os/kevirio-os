import React from "react";
import {
  Activity,
  BadgeCheck,
  CircleArrowRight,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  CircleMinus,
  CircleX,
  FileSearch,
  FlaskConical,
  Lock,
  ShieldCheck,
  TimerOff,
  TrendingUp,
  Clock3,
} from "lucide-react";

const ICONS = Object.freeze({ Activity, BadgeCheck, CircleArrowRight, CircleCheck, CircleDashed, CircleDot, CircleHelp, CircleMinus, CircleX, FileSearch, FlaskConical, Lock, ShieldCheck, TimerOff, TrendingUp, Clock3 });

export function StateIcon({ name = "CircleHelp", size = 14, className = "" }) {
  const Icon = ICONS[name] || CircleHelp;
  return <Icon className={className} size={size} strokeWidth={2} aria-hidden="true" focusable="false" />;
}
