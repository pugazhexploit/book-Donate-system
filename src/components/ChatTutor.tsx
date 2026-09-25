import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sliders,
  Bot,
  User,
  ExternalLink,
  Square,
  Compass,
  CheckCircle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import type { ChatMessage, ReadingLevel, SourceCitation } from '../types';

interface ChatTutorProps {
  messages: ChatMessage[];
  readingLevel: ReadingLevel;
  onChangeReadingLevel: (level: ReadingLevel) => void;
  isSocratic: boolean;
  onToggleSocratic: (val: boolean) => void;
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  onStopGeneration: () => void;
  onSelectCitation: (citation: SourceCitation) => void;
  hasDocuments: boolean;
}

const READING_LEVELS: { id: ReadingLevel; label: string; desc: string; icon: string }[] = [
  { id: 'elementary', label: 'Age 10 (Fun)', desc: 'Simple analogies & fun visual metaphors', icon: '🧒' },
  { id: 'high_school', label: 'High School', desc: 'Clear fundamentals & real-world connections', icon: '🎒' },
  { id: 'undergraduate', label: 'Undergraduate', desc: 'Rigorous collegiate terminology & mechanisms', icon: '🎓' },
  { id: 'expert', label: 'Expert / Research', desc: 'Deep biochemical kinetics & thermodynamics', icon: '🔬' }
];

const SUGGESTED_QUESTIONS = [
  'Why does the inner membrane have cristae folds?',
  'What happens if oxygen is absent in cellular respiration?',
  'How does ATP synthase act like a microscopic rotary motor?',
  'Explain the proton-motive force simply.'
];

export const ChatTutor = ({
  messages,
  readingLevel,
  onChangeReadingLevel,
  isSocratic,
  onToggleSocratic,
  onSendMessage,
  isGenerating,
  onStopGeneration,
  onSelectCitation,
  hasDocuments
}: ChatTutorProps) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const currentLevelIndex = READING_LEVELS.findIndex(l => l.id === readingLevel);

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9]">
      {/* Adaptive Learning Controls Bar */}
      <div className="border-b border-stone-200/80 bg-white/80 backdrop-blur p-3.5 space-y-3 shadow-2xs">
        {/* Complexity Slider Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Adaptive Level:
            </span>
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60 shadow-2xs">
              <span>{READING_LEVELS[currentLevelIndex].icon}</span>
              <span>{READING_LEVELS[currentLevelIndex].label}</span>
            </span>
          </div>

          {/* Socratic Mode Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1 rounded-xl border border-stone-200 transition-colors">
              <input
                type="checkbox"
                checked={isSocratic}
                onChange={(e) => onToggleSocratic(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 bg-white"
              />
              <div className="flex items-center gap-1.5 text-xs">
                <Compass className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-slate-800">Socratic Mentor</span>
                <span className="text-[10px] text-purple-700 font-bold px-1.5 py-0.2 rounded-full bg-purple-100">
                  {isSocratic ? 'Guiding' : 'Direct'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 4-Step Interactive Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={currentLevelIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              onChangeReadingLevel(READING_LEVELS[idx].id);
            }}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="grid grid-cols-4 text-[10px] text-slate-500 text-center font-medium">
            {READING_LEVELS.map((lvl, idx) => (
              <span
                key={lvl.id}
                onClick={() => onChangeReadingLevel(lvl.id)}
                className={`cursor-pointer transition-colors ${
                  idx === currentLevelIndex
                    ? 'text-indigo-700 font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {lvl.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-50 to-violet-100 border border-indigo-200/80 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Welcome to Your Study Space ☕
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Ask anything about your uploaded textbook or notes. LocalTutor adapts to your level and answers strictly from your material with 100% on-device privacy.
            </p>

            {hasDocuments && (
              <div className="mt-6 w-full space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Try asking one of these:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-3 rounded-xl bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-xs text-slate-700 transition-all text-left shadow-2xs font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-gradient-to-tr from-violet-500 to-indigo-600 text-white'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                    : 'bg-white text-slate-800 border border-stone-200/90 rounded-tl-none shadow-xs'
                }`}
              >
                {/* Assistant Metadata Pill */}
                {msg.role === 'assistant' && (msg.readingLevel || msg.isSocratic) && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-100 text-[10px] text-slate-500">
                    {msg.readingLevel && (
                      <span className="capitalize px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium">
                        Level: {msg.readingLevel.replace('_', ' ')}
                      </span>
                    )}
                    {msg.isSocratic && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-medium">
                        Socratic Guidance
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans text-[13px] text-slate-800 leading-relaxed">
                  {msg.content}
                </div>

                {/* Source Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Textbook Sources:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => onSelectCitation(cite)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 text-[11px] text-indigo-800 font-semibold transition-colors shadow-2xs"
                          title="Click to view exact source excerpt"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>
                            Source {cIdx + 1}
                            {cite.pageNumber ? ` (p.${cite.pageNumber})` : ''}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-stone-200/80 bg-white/90 backdrop-blur p-3 sm:p-4 shadow-xs">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              hasDocuments
                ? isSocratic
                  ? 'Ask a question or explain what you think...'
                  : 'Ask about any concept in your uploaded notes...'
                : 'Upload notes or load sample chapter above to begin...'
            }
            disabled={isGenerating}
            className="flex-1 bg-white border border-stone-300 text-slate-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-slate-400 transition-all shadow-2xs"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
