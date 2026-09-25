import { X, BookOpen, CheckCircle2, Bookmark } from 'lucide-react';
import type { SourceCitation } from '../types';

interface SourceViewerModalProps {
  citation: SourceCitation | null;
  onClose: () => void;
}

export const SourceViewerModal = ({ citation, onClose }: SourceViewerModalProps) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Textbook Excerpt Citation</span>
                {citation.pageNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                    Page {citation.pageNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {citation.docName}
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

        {/* Content Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-stone-100 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Indexed Chunk #{citation.chunkIndex + 1}
            </span>
            {citation.similarity > 0 && (
              <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                Match: {(citation.similarity * 100).toFixed(1)}%
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#fafaf9] border border-stone-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 shadow-2xs">
            {citation.text}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Retrieved from local browser IndexedDB storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
