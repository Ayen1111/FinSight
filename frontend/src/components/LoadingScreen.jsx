import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const texts = [
    "Analyzing Financial Patterns...",
    "Generating Smart Insights...",
    "Preparing Financial Intelligence..."
  ];

  useEffect(() => {
    // Phase 0 -> 1
    const t1 = setTimeout(() => setPhase(1), 800);
    // Phase 1 -> 2
    const t2 = setTimeout(() => setPhase(2), 1600);
    // Exit
    const t3 = setTimeout(() => setIsExiting(true), 2400);
    // Complete
    const t4 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-background)] transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-105 pointer-events-none filter blur-md' : 'opacity-100'}`}>
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] bg-[rgba(99,102,241,0.08)] rounded-full filter blur-[80px] animate-pulse"></div>
        <div className="w-[300px] h-[300px] bg-[rgba(139,92,246,0.06)] rounded-full filter blur-[60px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 blur-xl opacity-40 animate-pulse rounded-2xl"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl animate-[fsLogoFloat_3s_ease-in-out_infinite]">
            💰
          </div>
        </div>

        {/* Text Sequence */}
        <div className="h-8 flex items-center justify-center overflow-hidden">
          {texts.map((text, i) => (
            <div
              key={i}
              className={`absolute text-sm font-medium tracking-widest uppercase transition-all duration-500
                ${i === phase 
                  ? 'opacity-100 transform-none text-[var(--color-primary-light)] filter drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]' 
                  : i < phase 
                    ? 'opacity-0 -translate-y-4 filter blur-sm' 
                    : 'opacity-0 translate-y-4 filter blur-sm'
                }`}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-1 mt-8 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 w-full animate-[fsLoadingBar_2.4s_ease-in-out_forwards]"></div>
        </div>
      </div>
    </div>
  );
}
