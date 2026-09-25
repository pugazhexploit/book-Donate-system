import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Loader2,
  FolderOpen
} from 'lucide-react';
import type { DocumentItem, DocumentChunk } from '../types';

interface DocumentLibraryProps {
  documents: DocumentItem[];
  chunks: DocumentChunk[];
  onUploadFile: (file: File) => Promise<void>;
  onLoadSample: () => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  isIngesting: boolean;
  ingestionStatus: string;
  onSelectChunkForPreview: (chunk: DocumentChunk) => void;
}

export const DocumentLibrary = ({
  documents,
  chunks,
  onUploadFile,
  onLoadSample,
  onDeleteDocument,
  onClearAll,
  isIngesting,
  ingestionStatus,
  onSelectChunkForPreview
}: DocumentLibraryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fafaf9] border-r border-stone-200/80 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-slate-900">Study Materials</h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200/70 text-slate-700">
          {documents.length} source{documents.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Upload & Sample Section */}
      <div className="mt-4 space-y-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drag & Drop Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all bg-white shadow-2xs ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-stone-300 hover:border-indigo-400 hover:bg-indigo-50/20'
          }`}
        >
          <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Click or drag & drop notes here
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Accepts PDF, Word (DOCX), TXT, Markdown
          </p>
        </div>

        {/* Quick Sample Button */}
        <button
          onClick={onLoadSample}
          disabled={isIngesting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-violet-50/60 border border-violet-200 text-violet-700 transition-colors disabled:opacity-50 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span>Load Sample: Mitochondria Chapter</span>
        </button>
      </div>

      {/* Ingestion Status Banner */}
      {isIngesting && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 animate-pulse shadow-2xs">
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-indigo-900">Preparing Study Material</p>
            <p className="text-[11px] text-indigo-700">{ingestionStatus}</p>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="mt-5 flex-1 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 px-1 font-bold">
          <span>Active Notebooks</span>
          {documents.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-red-600 transition-colors font-semibold"
              title="Remove all sources"
            >
              Clear All
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-stone-200 rounded-2xl bg-white/70 shadow-2xs">
            <FolderOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-slate-700 font-semibold">Your study shelf is empty</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Upload textbook chapters, syllabi, or lecture slides to enable adaptive tutoring.
            </p>
          </div>
        ) : (
          documents.map(doc => {
            const isExpanded = expandedDocId === doc.id;
            const docChunks = chunks.filter(c => c.docId === doc.id);

            return (
              <div
                key={doc.id}
                className="border border-stone-200/90 rounded-2xl bg-white hover:border-stone-300 transition-colors shadow-2xs overflow-hidden"
              >
                <div className="p-3 flex items-start justify-between gap-2">
                  <div
                    className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                  >
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span className="uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {doc.type}
                        </span>
                        <span>•</span>
                        <span>{doc.chunkCount} chunks</span>
                        {doc.pageCount && (
                          <>
                            <span>•</span>
                            <span>{doc.pageCount} pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100"
                      title="Inspect chunks"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chunks Accordion */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-[#f8f9fa] p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>Textbook Chunks ({docChunks.length})</span>
                    </div>
                    {docChunks.map((chunk, idx) => (
                      <div
                        key={chunk.id}
                        onClick={() => onSelectChunkForPreview(chunk)}
                        className="p-2 rounded-xl bg-white hover:bg-indigo-50/40 border border-stone-200/70 text-[11px] text-slate-700 cursor-pointer transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-bold text-indigo-700">
                            Excerpt #{idx + 1}
                          </span>
                          <span>~{chunk.tokenEstimate} tokens</span>
                        </div>
                        <p className="line-clamp-2 text-slate-600">
                          {chunk.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RAG pipeline info footer */}
      <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Vector Store</span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">all-MiniLM-L6-v2</span>
      </div>
    </div>
  );
};
