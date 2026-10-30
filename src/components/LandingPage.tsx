"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicFooter } from "@/components/ui/motion-footer";
import {
  ChevronDown,
  Sparkles,
  CircuitBoard,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { playSnap } from "../utils/audioFeedback";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface LandingPageProps {
  onEnterLab: () => void;
}

export function OptiSimLandingPage({ onEnterLab }: LandingPageProps) {
  const [isPoweringOn] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleEnterClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playSnap();
    onEnterLab();
  };

  return (
    <div
      className={`relative w-full min-h-screen bg-[#0B0F19] text-[#F8FAFC] font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF] overflow-x-hidden transition-all duration-300 ${
        isPoweringOn ? "opacity-0 scale-105 filter brightness-150" : "opacity-100"
      }`}
    >
      {/* 
        ========================================================================
        1. MAIN UPPER SECTION: WELCOME HERO & PRIMARY CTA
        ========================================================================
      */}
      <main
        ref={heroRef}
        className="relative z-10 w-full min-h-[110vh] bg-[#0B0F19] flex flex-col items-center justify-between py-10 sm:py-14 px-6 text-center border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-b-[2.5rem]"
      >
        {/* Subtle Background Glow & Tech Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(0,240,255,0.08)_0%,transparent_65%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top Header Eyebrow */}
        <div className="relative z-10 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] text-[11px] sm:text-xs font-mono font-medium tracking-widest uppercase shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span>SPPU ENTC ENGINEERING SIMULATION PLATFORM</span>
          </div>
        </div>

        {/* Central Hero Block */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center my-auto py-8 sm:py-12">
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6 uppercase footer-text-glow select-none">
            WELCOME TO OPTI-SIM
          </h1>

          <p className="text-lg sm:text-2xl md:text-3xl text-slate-300 font-light mb-8 max-w-2xl leading-relaxed">
            Bored doing the hardware practical?
            <br />
            <span className="text-[#00F0FF] font-semibold drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              Here's how you could do it in a more engaging way!
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-mono text-slate-400">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" /> 17 Guided Experiments
            </span>
            <span className="text-[#00F0FF]">✦</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <CircuitBoard className="w-3.5 h-3.5 text-[#FF5722]" /> Visual CAD Builder
            </span>
            <span className="text-[#FF5722]">✦</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#10B981]" /> Real-Time Waveform Scope
            </span>
          </div>
        </div>

        {/* Bottom "Scroll Down To Reveal" Prompt */}
        <div className="relative z-10 pb-4 flex flex-col items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#00F0FF] font-semibold animate-pulse flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            Scroll down to reveal
          </span>

          <div className="flex flex-col items-center">
            <div className="w-[1.5px] h-12 bg-gradient-to-b from-[#00F0FF] via-[#00F0FF]/50 to-transparent" />
            <ChevronDown className="w-5 h-5 text-[#00F0FF] animate-bounce -mt-1" />
          </div>
        </div>
      </main>

      {/* 
        ========================================================================
        2. CURTAIN REVEAL FOOTER: OPTI-SIM & ENTER THE LABORATORY
        ========================================================================
      */}
      <CinematicFooter
        heading="OPTI-SIM"
        giantText="OPTI-SIM"
        craftedByName="Dhruv Katkar"
        onEnterLab={handleEnterClick}
      />
    </div>
  );
}

export default OptiSimLandingPage;
export { OptiSimLandingPage as LandingPage };
