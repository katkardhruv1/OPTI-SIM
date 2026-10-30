"use client";

import React, { useState } from "react";
import {
  CustomCursor,
  CustomCursorTarget,
} from "@/components/ui/custom-cursor";
import { ArrowLeft, Moon, Sun, Sparkles, Check } from "lucide-react";

export function CustomCursorDemo({
  color = "#ff4c24",
}: {
  color?: string;
}) {
  return (
    <CustomCursor className="w-full" color={color} layout="demo">
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-muted-foreground select-none">
          Move your pointer over the target
        </p>
        <CustomCursorTarget
          aria-label="Interactive target"
          className="rounded-2xl border bg-background text-foreground shadow-sm cursor-none transition-transform hover:scale-105 active:scale-95"
          size="lg"
        >
          <svg
            aria-hidden="true"
            className="size-7"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3v18M3 12h18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </CustomCursorTarget>
      </div>
    </CustomCursor>
  );
}

export interface CustomCursorShowcaseProps {
  onBack?: () => void;
}

export function CustomCursorShowcase({ onBack }: CustomCursorShowcaseProps) {
  const [isDark, setIsDark] = useState(false);
  const [cursorColor, setCursorColor] = useState("#ff4c24");

  const colors = [
    { label: "Sora Orange", hex: "#ff4c24" },
    { label: "Neon Cyan", hex: "#00F0FF" },
    { label: "Emerald", hex: "#10B981" },
    { label: "Violet", hex: "#a855f7" },
    { label: "Gold", hex: "#f59e0b" },
  ];

  return (
    <div
      className={`min-h-screen w-screen flex flex-col transition-colors duration-200 select-none ${
        isDark ? "dark bg-[#0B0F19] text-[#F8FAFC]" : "bg-white text-[#09090b]"
      }`}
    >
      {/* Top Navigation Bar */}
      <header className="h-14 border-b px-6 flex items-center justify-between shrink-0 border-inherit/15">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-inherit/20 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to OPTI-SIM</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight">
              21st.dev / SoraLabs
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-[#ff4c24] font-mono font-medium">
              custom-cursor
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Color Palettes */}
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setCursorColor(c.hex)}
                className="w-5 h-5 rounded-full relative transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {cursorColor === c.hex && (
                  <Check className="w-3 h-3 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark((prev) => !prev)}
            className="p-2 rounded-lg border border-inherit/20 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            title={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Demo Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <CustomCursor
          className="w-full h-full flex flex-col items-center justify-center"
          color={cursorColor}
          layout="demo"
        >
          <div className="flex flex-col items-center gap-8 max-w-md text-center">
            <div className="space-y-1.5">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-slate-400" : "text-neutral-500"
                }`}
              >
                Move your pointer over the target
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                Watch the cursor spring-animate and expand on hover
              </p>
            </div>

            {/* Main Primary Target (from original demo) */}
            <CustomCursorTarget
              aria-label="Interactive target"
              className={`rounded-2xl border shadow-sm transition-all duration-200 cursor-none hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-[#1A1E29] border-white/10 text-white shadow-black/40"
                  : "bg-white border-neutral-200 text-neutral-900 shadow-neutral-200/60"
              }`}
              size="lg"
            >
              <svg
                aria-hidden="true"
                className="size-7"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3v18M3 12h18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </CustomCursorTarget>

            {/* Additional Target Sizes Demonstration */}
            <div className="pt-8 flex flex-col items-center gap-3">
              <span
                className={`text-[11px] font-mono tracking-wider uppercase ${
                  isDark ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                Size Variants
              </span>
              <div className="flex items-center gap-4">
                <CustomCursorTarget
                  className={`rounded-xl border shadow-sm transition-all cursor-none ${
                    isDark
                      ? "bg-[#1A1E29] border-white/10 text-white"
                      : "bg-white border-neutral-200 text-neutral-800"
                  }`}
                  size="sm"
                  title="Small Target"
                >
                  <Sparkles className="w-4 h-4" />
                </CustomCursorTarget>

                <CustomCursorTarget
                  className={`rounded-xl border shadow-sm transition-all cursor-none ${
                    isDark
                      ? "bg-[#1A1E29] border-white/10 text-white"
                      : "bg-white border-neutral-200 text-neutral-800"
                  }`}
                  size="md"
                  title="Medium Target"
                >
                  <Sparkles className="w-5 h-5" />
                </CustomCursorTarget>

                <CustomCursorTarget
                  className={`rounded-xl border shadow-sm transition-all cursor-none ${
                    isDark
                      ? "bg-[#1A1E29] border-white/10 text-white"
                      : "bg-white border-neutral-200 text-neutral-800"
                  }`}
                  size="lg"
                  title="Large Target"
                >
                  <Sparkles className="w-6 h-6" />
                </CustomCursorTarget>
              </div>
            </div>
          </div>
        </CustomCursor>

        {/* Installation info footer */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <code
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono ${
              isDark
                ? "bg-[#111520] border-white/10 text-slate-400"
                : "bg-neutral-50 border-neutral-200 text-neutral-600"
            }`}
          >
            npx shadcn@latest add "https://21st.dev/r/soralabs/custom-cursor"
          </code>
        </div>
      </main>
    </div>
  );
}

export default CustomCursorDemo;
