import React, { useState, useEffect } from 'react';
import { Zap, Shield, Radio, Activity, Cpu, ArrowRight } from 'lucide-react';

interface StartupScreenProps {
  onComplete: () => void;
}

export function StartupScreen({ onComplete }: StartupScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing VoltPulse Grid Node...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds total startup sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStatusText('Ingesting SCADA telemetry & substation sensors...');
      } else if (pct < 65) {
        setStatusText('Synchronizing GIS spatial grid & feeder topology...');
      } else if (pct < 90) {
        setStatusText('Connecting Field Crew & Dispatch uplink channels...');
      } else {
        setStatusText('Grid Command Ready. Opening Secure Portal...');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 350);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#070A12] flex flex-col items-center justify-center p-6 text-slate-100 select-none overflow-hidden transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Cybernetic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1726_1px,transparent_1px),linear-gradient(to_bottom,#0e1726_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Radiant Glowing Halos */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Main Logo & Identity Card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Animated App Logo Container */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer Pulsing Concentric Energy Rings */}
          <div className="absolute -inset-6 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
          <div className="absolute -inset-3 rounded-full border border-cyan-400/30 animate-pulse" />
          <div className="absolute -inset-8 rounded-full border border-amber-500/15 animate-[spin_12s_linear_infinite]" />

          {/* Primary Emblem Body */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-950 p-[2px] shadow-2xl shadow-cyan-500/25 border border-cyan-500/50">
            <div className="w-full h-full rounded-[22px] bg-[#090E1A] flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Internal subtle scan line */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-12 w-full animate-[bounce_3s_infinite] pointer-events-none" />

              {/* Central Glowing Energy Bolt */}
              <div className="relative">
                <Zap className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-400 fill-cyan-400 filter drop-shadow-[0_0_18px_rgba(34,211,238,0.85)] animate-pulse" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-900 shadow-md animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-[11px] font-mono font-bold tracking-widest text-cyan-300 uppercase shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            GRID TELEMETRY SYSTEM v2.4
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
            VOLTPULSE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
            Locality Outage Intelligence & Crew Dispatch Control
          </p>
        </div>

        {/* Progress & Diagnostic Bar */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 truncate max-w-[280px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="font-bold text-cyan-300 ml-2">{progress}%</span>
          </div>

          {/* Bar Track */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
            <span>NODE: BESCOM-BLR-09</span>
            <span>ENCRYPTED 256-BIT</span>
          </div>
        </div>

        {/* Skip to Login Button */}
        <div className="mt-6">
          <button
            id="btn-skip-startup"
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <span>Skip to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtext Footer */}
      <div className="absolute bottom-5 text-[10px] text-slate-600 font-mono text-center flex items-center gap-3">
        <span>BESCOM Urban Distribution Grid</span>
        <span>•</span>
        <span>SCADA Ingestion Active</span>
        <span>•</span>
        <span>Instant Crew Uplink</span>
      </div>
    </div>
  );
}
