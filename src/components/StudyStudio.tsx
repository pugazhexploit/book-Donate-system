import { useState } from 'react';
import {
  HelpCircle,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Compass,
  FileCheck2,
  SmilePlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QuizQuestion, Flashcard } from '../types';

interface StudyStudioProps {
  quizzes: QuizQuestion[];
  flashcards: Flashcard[];
  onGenerateQuizzes: () => void;
  hasDocuments: boolean;
}

export const StudyStudio = ({
  quizzes,
  flashcards,
  onGenerateQuizzes,
  hasDocuments
}: StudyStudioProps) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards' | 'notes'>('quiz');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizState, setQuizState] = useState<{ [quizId: string]: { selected: number; isAnswered: boolean } }>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Confetti trigger
  const fireConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  const handleSelectOption = (quiz: QuizQuestion, optionIndex: number) => {
    if (quizState[quiz.id]?.isAnswered) return;

    const isCorrect = optionIndex === quiz.correctIndex;
    if (isCorrect) {
      fireConfetti();
    }

    setQuizState(prev => ({
      ...prev,
      [quiz.id]: {
        selected: optionIndex,
        isAnswered: true
      }
    }));
  };

  const handleResetQuiz = () => {
    setQuizState({});
    setCurrentQuizIndex(0);
  };

  // Score calculation
  const totalAnswered = Object.keys(quizState).length;
  const correctCount = quizzes.filter(
    q => quizState[q.id]?.selected === q.correctIndex
  ).length;

  const currentQuiz = quizzes[currentQuizIndex];
  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="flex flex-col h-full bg-[#fafaf9] border-l border-stone-200/80 p-4 overflow-y-auto">
      {/* Studio Navigation Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-xl text-xs w-full">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz Desk</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'flashcards'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>
        </div>
      </div>

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="mt-4 flex-1 flex flex-col justify-between">
          {!hasDocuments ? (
            <div className="p-6 text-center border border-dashed border-stone-200 rounded-2xl bg-white/70 shadow-2xs my-auto">
              <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-slate-800 font-bold">Auto-Generated Quizzes</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Upload notes or load the sample chapter to generate instant, adaptive quiz questions with Socratic feedback.
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center p-6 my-auto">
              <button
                onClick={onGenerateQuizzes}
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Adaptive Quiz</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quiz Header & Progress */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Question {currentQuizIndex + 1} of {quizzes.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Score: {correctCount}/{totalAnswered}
                  </span>
                  <button
                    onClick={handleResetQuiz}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100"
                    title="Reset quiz"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5">
                {quizzes.map((q, idx) => {
                  const state = quizState[q.id];
                  const isCur = idx === currentQuizIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuizIndex(idx)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        isCur
                          ? 'bg-indigo-600 ring-2 ring-indigo-200'
                          : state
                          ? state.selected === q.correctIndex
                            ? 'bg-emerald-500'
                            : 'bg-rose-400'
                          : 'bg-stone-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Question Card */}
              {currentQuiz && (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {currentQuiz.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2 mt-3">
                    {currentQuiz.options.map((opt, optIdx) => {
                      const state = quizState[currentQuiz.id];
                      const isSelected = state?.selected === optIdx;
                      const isCorrect = optIdx === currentQuiz.correctIndex;
                      const isAnswered = state?.isAnswered;

                      let btnStyle =
                        'border-stone-200 bg-stone-50/70 hover:bg-indigo-50/40 hover:border-indigo-200 text-slate-700';
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle =
                            'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold shadow-2xs';
                        } else if (isSelected) {
                          btnStyle =
                            'border-rose-300 bg-rose-50 text-rose-900 line-through shadow-2xs';
                        } else {
                          btnStyle = 'border-stone-200 bg-stone-50/40 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuiz, optIdx)}
                          disabled={isAnswered}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all flex items-start gap-2 shadow-2xs ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 bg-white">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Socratic Feedback & Explanation */}
                  {quizState[currentQuiz.id]?.isAnswered && (
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                      {quizState[currentQuiz.id].selected === currentQuiz.correctIndex ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shadow-2xs">
                          <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                            <SmilePlus className="w-4 h-4 text-emerald-600" />
                            Correct! Great recall! 🎉
                          </p>
                          <p className="text-[11px] text-emerald-800/90 mt-1 leading-relaxed">
                            {currentQuiz.explanation}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 shadow-2xs">
                          <p className="font-bold flex items-center gap-1.5 text-amber-800">
                            <Compass className="w-4 h-4 text-amber-600" />
                            Socratic Guiding Hint:
                          </p>
                          <p className="text-[11px] text-amber-900/90 mt-1 leading-relaxed">
                            {currentQuiz.socraticHint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Nav */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setCurrentQuizIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuizIndex === 0}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 text-xs text-slate-700 hover:bg-stone-200 disabled:opacity-40 flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() =>
                        setCurrentQuizIndex(prev => Math.min(quizzes.length - 1, prev + 1))
                      }
                      disabled={currentQuizIndex === quizzes.length - 1}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-xs text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1 font-semibold shadow-2xs"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FLASHCARDS TAB */}
      {activeTab === 'flashcards' && (
        <div className="mt-4 flex-1 flex flex-col justify-between">
          {flashcards.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-stone-200 rounded-2xl bg-white/70 shadow-2xs my-auto">
              <Award className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-slate-800 font-bold">Study Flashcards</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Upload notes to automatically generate active recall cards.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {currentCard?.sourceRef || 'Document Source'}
                </span>
              </div>

              {/* Flashcard 3D Card (Notion/Index card style) */}
              <div
                onClick={() => setIsFlipped(f => !f)}
                className="min-h-[230px] p-6 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all shadow-xs"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center justify-between">
                  <span>{isFlipped ? 'Answer (Recall 💡)' : 'Question (Prompt ❓)'}</span>
                  <span className="text-slate-400 font-normal">Click to flip 🔄</span>
                </div>

                <div className="my-auto text-center py-4">
                  <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                    {isFlipped ? currentCard?.back : currentCard?.front}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-medium">
                  Active Recall Practice
                </div>
              </div>

              {/* Flashcard Nav */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={currentCardIndex === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 text-xs text-slate-700 hover:bg-stone-200 disabled:opacity-40 flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev Card
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                  }}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-xs text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1 font-semibold shadow-2xs"
                >
                  Next Card <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="mt-4 flex-1 space-y-3 text-xs leading-relaxed text-slate-700">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Core Textbook Takeaways</span>
            </div>
            <ul className="list-disc pl-4 space-y-2 text-slate-700 text-[12px] leading-relaxed">
              <li>
                <strong>Double Membrane:</strong> Outer membrane contains porins; inner membrane forms folded cristae to maximize ETC surface area.
              </li>
              <li>
                <strong>Proton Motive Force:</strong> Complexes I, III, and IV pump protons into the intermembrane space, creating an electrochemical gradient ($\Delta p$).
              </li>
              <li>
                <strong>ATP Synthase Rotor:</strong> Chemiosmotic proton influx drives the rotary $F_0$ subunit, powering the catalytic $F_1$ unit to synthesize ATP from ADP + Pi.
              </li>
              <li>
                <strong>Terminal Electron Acceptor:</strong> Molecular Oxygen ($O_2$) is reduced to water ($H_2O$), preventing electron backup.
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1 shadow-2xs">
            <span className="font-bold text-amber-800">Adaptive Study Tip:</span>
            <p>
              Switch the Complexity slider above to <em>&quot;Elementary&quot;</em> if you want a fun story-based analogy, or to <em>&quot;Expert&quot;</em> for biochemical thermodynamic formulas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
