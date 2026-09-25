import { Cpu, ShieldCheck, HardDrive, Zap, Info, GraduationCap } from 'lucide-react';
import { AVAILABLE_MODELS, type WebGPUDiagnostics } from '../services/webllm';
import type { ModelOption } from '../types';

interface NavbarProps {
  webgpuDiag: WebGPUDiagnostics | null;
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  isModelLoaded: boolean;
  isLoadingModel: boolean;
  loadingProgress: number;
  loadingText: string;
  onLoadModel: () => void;
  useSimulation: boolean;
  onToggleSimulation: (val: boolean) => void;
  totalChunks: number;
  onOpenPrivacyInfo: () => void;
}

export const Navbar = ({
  webgpuDiag,
  selectedModel,
  onSelectModel,
  isModelLoaded,
  isLoadingModel,
  loadingProgress,
  loadingText,
  onLoadModel,
  useSimulation,
  onToggleSimulation,
  totalChunks,
  onOpenPrivacyInfo
}: NavbarProps) => {
  return (
    <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-sm text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                LocalTutor
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Study Space
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Private, On-Device Adaptive Learning & Notebook
            </p>
          </div>
        </div>

        {/* Engine Controls & Diagnostic */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Privacy Badge */}
          <button
            onClick={onOpenPrivacyInfo}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs font-medium"
            title="All AI runs directly on your computer. No data leaves your browser."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">100% Private & Local</span>
            <Info className="w-3 h-3 text-emerald-600/70" />
          </button>

          {/* WebGPU Status Pill */}
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border shadow-2xs ${
              webgpuDiag?.supported
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={webgpuDiag?.error || webgpuDiag?.adapterName || 'WebGPU Status'}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-medium">
              {webgpuDiag?.supported ? 'WebGPU Active' : 'WebGPU Inactive'}
            </span>
          </div>

          {/* Mode Switch: Local GPU vs Instant Simulation */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => onToggleSimulation(false)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                !useSimulation
                  ? 'bg-white text-indigo-700 shadow-xs border border-stone-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Run with real WebLLM weights directly inside your browser GPU"
            >
              WebLLM (GPU)
            </button>
            <button
              onClick={() => onToggleSimulation(true)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                useSimulation
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Instant testing mode: simulates local LLM responses without downloading full weights"
            >
              <Zap className="w-3 h-3" />
              Fast Sim
            </button>
          </div>

          {/* Model Selector (when WebLLM is active) */}
          {!useSimulation && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Select WebLLM Model"
                value={selectedModel.id}
                onChange={(e) => {
                  const found = AVAILABLE_MODELS.find(m => m.id === e.target.value);
                  if (found) onSelectModel(found);
                }}
                disabled={isLoadingModel}
                className="bg-white border border-stone-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs font-medium"
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.size})
                  </option>
                ))}
              </select>

              {!isModelLoaded && (
                <button
                  onClick={onLoadModel}
                  disabled={isLoadingModel}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  {isLoadingModel ? 'Loading...' : 'Load Model'}
                </button>
              )}

              {isModelLoaded && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-medium shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready
                </span>
              )}
            </div>
          )}

          {/* Stored Chunks Badge */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-600 bg-stone-100 px-2.5 py-1.5 rounded-full border border-stone-200">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium">{totalChunks} Chunks in Desk DB</span>
          </div>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoadingModel && (
        <div className="w-full bg-stone-100 h-1.5 overflow-hidden border-t border-stone-200">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300"
            style={{ width: `${Math.max(5, loadingProgress)}%` }}
          />
          <div className="max-w-7xl mx-auto px-4 py-1 text-[11px] text-indigo-700 flex justify-between bg-indigo-50/60 font-medium">
            <span>{loadingText || 'Fetching WebLLM model weights into browser cache...'}</span>
            <span>{loadingProgress}%</span>
          </div>
        </div>
      )}
    </header>
  );
};
