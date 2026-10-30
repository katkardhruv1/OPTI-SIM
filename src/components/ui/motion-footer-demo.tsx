"use client";

import React from "react";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { ChevronDown, Sparkles } from "lucide-react";

export function MotionFooterDemo({ onEnterLab }: { onEnterLab?: () => void }) {
  return (
    <div className="relative w-full bg-[#0B0F19] min-h-screen font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF] overflow-x-hidden text-white">
      {/* 
        MAIN UPPER CONTENT AREA 
        Scroll down to reveal the curtain footer underneath
      */}
      <main className="relative z-10 w-full min-h-[110vh] bg-[#0B0F19] flex flex-col items-center justify-between py-16 px-6 text-center border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(0,240,255,0.08)_0%,transparent_65%)] pointer-events-none" />

        <div className="relative z-10 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span>OPTI-SIM Engineering Simulation</span>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center my-auto py-12">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 uppercase footer-text-glow select-none">
            WELCOME TO OPTI-SIM
          </h1>
          <p className="text-lg sm:text-2xl text-slate-300 font-light mb-8 max-w-2xl leading-relaxed">
            Bored doing the hardware practical?<br />
            <span className="text-[#00F0FF] font-semibold">Here's how you could do it in a more engaging way!</span>
          </p>
        </div>

        <div className="relative z-10 pb-4 flex flex-col items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#00F0FF] font-semibold animate-pulse flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            Scroll down to reveal
          </span>
          <div className="flex flex-col items-center">
            <div className="w-[1.5px] h-14 bg-gradient-to-b from-[#00F0FF] via-[#00F0FF]/50 to-transparent" />
            <ChevronDown className="w-5 h-5 text-[#00F0FF] animate-bounce -mt-1" />
          </div>
        </div>
      </main>

      {/* The Cinematic Footer is injected here */}
      <CinematicFooter onEnterLab={onEnterLab} />
    </div>
  );
}

export default MotionFooterDemo;
