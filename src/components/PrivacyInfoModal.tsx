import { X, ShieldCheck, HardDrive, Cpu, Lock, Check } from 'lucide-react';

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyInfoModal = ({ isOpen, onClose }: PrivacyInfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                100% Client-Side Privacy Guarantee
              </h3>
              <p className="text-xs text-emerald-700 font-semibold">
                Zero Cloud AI • Zero Data Transmission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed bg-white">
          <p>
            LocalTutor was engineered specifically for student and institutional privacy. Traditional AI platforms transmit your uploaded notes, essays, and questions to external cloud servers.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <Cpu className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">WebLLM via WebGPU</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  LLM weights execute directly on your device&#39;s graphics processor using MLC WebLLM. Computation is entirely local.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Transformers.js (WASM)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Semantic embeddings (all-MiniLM-L6-v2) run locally via WebAssembly inside your browser tab without API keys.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <HardDrive className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Dexie.js IndexedDB Storage</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  All textbooks, parsed chunks, vectors, and chat transcripts are stored strictly in your browser&#39;s local IndexedDB database.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Safe for schools, universities, and confidential student coursework.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
