import { useState, useEffect, useRef } from 'react';
import {
  checkWebGPUSupport,
  initWebLLMEngine,
  streamTutoringResponse,
  AVAILABLE_MODELS,
  type WebGPUDiagnostics
} from './services/webllm';
import {
  generateEmbedding,
  searchRelevantChunks,
  setEmbeddingProgressCallback
} from './services/embeddings';
import { parsePdf } from './services/pdfParser';
import { parseDocx } from './services/docxParser';
import { chunkText } from './services/chunker';
import {
  generateQuizzesFromChunks,
  generateFlashcardsFromChunks
} from './services/quizGenerator';
import { db, clearAllLocalData } from './db';
import { SAMPLE_BIOLOGY_DOCUMENT } from './data/sampleBiologyDoc';

import { Navbar } from './components/Navbar';
import { DocumentLibrary } from './components/DocumentLibrary';
import { ChatTutor } from './components/ChatTutor';
import { StudyStudio } from './components/StudyStudio';
import { SourceViewerModal } from './components/SourceViewerModal';
import { PrivacyInfoModal } from './components/PrivacyInfoModal';

import type {
  DocumentItem,
  DocumentChunk,
  ChatMessage,
  QuizQuestion,
  Flashcard,
  ReadingLevel,
  ModelOption,
  SourceCitation
} from './types';

export function App() {
  // WebGPU & Model Engine State
  const [webgpuDiag, setWebgpuDiag] = useState<WebGPUDiagnostics | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [useSimulation, setUseSimulation] = useState(false);

  // App Data State (persisted in Dexie IndexedDB)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Tutor Configuration State
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('high_school');
  const [isSocratic, setIsSocratic] = useState(false);

  // Operation State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const stopGenerationRef = useRef(false);

  // Modals & Panels State
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'studio'>('chat');

  // Load Initial State from IndexedDB & Detect WebGPU
  useEffect(() => {
    async function init() {
      // 1. WebGPU Hardware Detection
      const diag = await checkWebGPUSupport();
      setWebgpuDiag(diag);
      if (!diag.supported) {
        setUseSimulation(true);
      }

      // 2. Load IndexedDB Cache
      try {
        const storedDocs = await db.documents.toArray();
        const storedChunks = await db.chunks.toArray();
        const storedChats = await db.chats.orderBy('timestamp').toArray();
        const storedQuizzes = await db.quizzes.toArray();
        const storedCards = await db.flashcards.toArray();

        setDocuments(storedDocs);
        setChunks(storedChunks);
        setMessages(storedChats);
        setQuizzes(storedQuizzes);
        setFlashcards(storedCards);
      } catch (err) {
        console.error('Error loading data from Dexie:', err);
      }
    }

    init();
  }, []);

  // Handle Model Loading
  const handleLoadModel = async () => {
    try {
      setIsLoadingModel(true);
      setLoadingProgress(5);
      setLoadingText(`Initializing WebLLM runtime...`);

      await initWebLLMEngine(selectedModel.id, (pct, msg) => {
        setLoadingProgress(pct);
        setLoadingText(msg);
      });

      setIsModelLoaded(true);
      setIsLoadingModel(false);
    } catch (err: any) {
      console.error('Failed to load WebLLM model:', err);
      alert(`Could not load WebLLM weights: ${err.message || err}. Falling back to Fast Simulation Mode.`);
      setIsLoadingModel(false);
      setUseSimulation(true);
    }
  };

  // Ingestion Pipeline (PDF / DOCX / TXT -> Chunks -> Embeddings -> IndexedDB)
  const processAndStoreDocument = async (
    docName: string,
    fileType: 'pdf' | 'docx' | 'txt' | 'sample',
    fileSize: number,
    rawText: string,
    pageCount?: number
  ) => {
    const docId = `doc-${Date.now()}`;
    setIsIngesting(true);
    setIngestionStatus('Chunking extracted text...');

    const newChunks = chunkText(rawText, docId, docName);

    setIngestionStatus(`Generating 384d semantic vectors (0/${newChunks.length})...`);
    setEmbeddingProgressCallback((_pct, txt) => {
      setIngestionStatus(txt);
    });

    const embeddedChunks: DocumentChunk[] = [];
    for (let i = 0; i < newChunks.length; i++) {
      const c = newChunks[i];
      setIngestionStatus(`Embedding chunk ${i + 1} of ${newChunks.length}...`);
      const vec = await generateEmbedding(c.text);
      embeddedChunks.push({
        ...c,
        embedding: vec || undefined,
        pageNumber: pageCount ? Math.min(pageCount, Math.floor((i / newChunks.length) * pageCount) + 1) : 1
      });
    }

    setIngestionStatus('Saving document and vectors to browser IndexedDB...');
    const newDoc: DocumentItem = {
      id: docId,
      name: docName,
      type: fileType,
      size: fileSize,
      pageCount,
      uploadedAt: Date.now(),
      chunkCount: embeddedChunks.length
    };

    // Auto-generate Quizzes and Flashcards for student
    const generatedQuizzes = generateQuizzesFromChunks(embeddedChunks, 4);
    const generatedCards = generateFlashcardsFromChunks(embeddedChunks);

    await db.transaction('rw', db.documents, db.chunks, db.quizzes, db.flashcards, async () => {
      await db.documents.add(newDoc);
      await db.chunks.bulkAdd(embeddedChunks);
      if (generatedQuizzes.length > 0) await db.quizzes.bulkAdd(generatedQuizzes);
      if (generatedCards.length > 0) await db.flashcards.bulkAdd(generatedCards);
    });

    // Update state
    setDocuments(prev => [...prev, newDoc]);
    setChunks(prev => [...prev, ...embeddedChunks]);
    setQuizzes(prev => [...prev, ...generatedQuizzes]);
    setFlashcards(prev => [...prev, ...generatedCards]);

    setIsIngesting(false);
    setIngestionStatus('');
  };

  // Upload File Handler
  const handleUploadFile = async (file: File) => {
    try {
      setIsIngesting(true);
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        setIngestionStatus('Parsing PDF with pdf.js...');
        const parsed = await parsePdf(file);
        await processAndStoreDocument(file.name, 'pdf', file.size, parsed.text, parsed.pageCount);
      } else if (ext === 'docx') {
        setIngestionStatus('Parsing Word DOCX with mammoth.js...');
        const parsedText = await parseDocx(file);
        await processAndStoreDocument(file.name, 'docx', file.size, parsedText);
      } else {
        setIngestionStatus('Reading plain text file...');
        const text = await file.text();
        await processAndStoreDocument(file.name, 'txt', file.size, text);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert(`Could not parse file: ${err.message || err}`);
      setIsIngesting(false);
      setIngestionStatus('');
    }
  };

  // Load Sample Biology Chapter Handler
  const handleLoadSample = async () => {
    const sample = SAMPLE_BIOLOGY_DOCUMENT;
    await processAndStoreDocument(
      sample.name,
      'sample',
      sample.text.length,
      sample.text,
      5
    );
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    await db.transaction('rw', db.documents, db.chunks, db.quizzes, db.flashcards, async () => {
      await db.documents.delete(docId);
      await db.chunks.where('docId').equals(docId).delete();
      await db.quizzes.where('docId').equals(docId).delete();
      await db.flashcards.where('docId').equals(docId).delete();
    });

    setDocuments(prev => prev.filter(d => d.id !== docId));
    setChunks(prev => prev.filter(c => c.docId !== docId));
    setQuizzes(prev => prev.filter(q => q.docId !== docId));
    setFlashcards(prev => prev.filter(f => f.docId !== docId));
  };

  // Clear All Workspace
  const handleClearAll = async () => {
    if (confirm('Clear all uploaded materials, embeddings, and chat history from your browser?')) {
      await clearAllLocalData();
      setDocuments([]);
      setChunks([]);
      setMessages([]);
      setQuizzes([]);
      setFlashcards([]);
    }
  };

  // Chat Query & Generation Loop
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    stopGenerationRef.current = false;
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    await db.chats.add(userMsg);

    setIsGenerating(true);

    try {
      // 1. Vector Search: Find top-4 semantic chunks from local IndexedDB
      const citations = await searchRelevantChunks(text, chunks, 4);

      // 2. Placeholder assistant message for streaming
      const assistantMsgId = `assistant-${Date.now()}`;
      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        citations,
        readingLevel,
        isSocratic
      };

      setMessages(prev => [...prev, initialAssistantMsg]);

      // 3. Stream from WebLLM (or adaptive local simulator)
      let fullContent = '';
      await streamTutoringResponse(
        text,
        readingLevel,
        isSocratic,
        citations,
        (delta) => {
          if (stopGenerationRef.current) return;
          fullContent += delta;
          setMessages(prev =>
            prev.map(m => (m.id === assistantMsgId ? { ...m, content: fullContent } : m))
          );
        },
        useSimulation || !isModelLoaded
      );

      // 4. Save final message to Dexie
      const finalMsg: ChatMessage = {
        ...initialAssistantMsg,
        content: fullContent
      };
      await db.chats.add(finalMsg);
    } catch (err: any) {
      console.error('Chat generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    stopGenerationRef.current = true;
    setIsGenerating(false);
  };

  // Regenerate Quiz
  const handleGenerateQuizzes = async () => {
    const newQuizzes = generateQuizzesFromChunks(chunks, 4);
    await db.quizzes.bulkAdd(newQuizzes);
    setQuizzes(prev => [...prev, ...newQuizzes]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-slate-800 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        webgpuDiag={webgpuDiag}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isModelLoaded={isModelLoaded}
        isLoadingModel={isLoadingModel}
        loadingProgress={loadingProgress}
        loadingText={loadingText}
        onLoadModel={handleLoadModel}
        useSimulation={useSimulation}
        onToggleSimulation={setUseSimulation}
        totalChunks={chunks.length}
        onOpenPrivacyInfo={() => setIsPrivacyModalOpen(true)}
      />

      {/* Mobile Tab Selector */}
      <div className="md:hidden flex border-b border-stone-200 bg-white text-xs font-bold">
        <button
          onClick={() => setMobileTab('sources')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileTab === 'sources'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Sources ({documents.length})
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileTab === 'chat'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Adaptive Tutor
        </button>
        <button
          onClick={() => setMobileTab('studio')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            mobileTab === 'studio'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Study Studio
        </button>
      </div>

      {/* Main 3-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Document Sources (Desktop or Mobile active) */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            mobileTab === 'sources' ? 'block' : 'hidden md:block'
          }`}
        >
          <DocumentLibrary
            documents={documents}
            chunks={chunks}
            onUploadFile={handleUploadFile}
            onLoadSample={handleLoadSample}
            onDeleteDocument={handleDeleteDocument}
            onClearAll={handleClearAll}
            isIngesting={isIngesting}
            ingestionStatus={ingestionStatus}
            onSelectChunkForPreview={(c) =>
              setActiveCitation({
                chunkId: c.id,
                docName: c.docName,
                chunkIndex: c.chunkIndex,
                pageNumber: c.pageNumber,
                text: c.text,
                similarity: 1.0
              })
            }
          />
        </div>

        {/* Center Column: Adaptive Tutor Chat */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'chat' ? 'block' : 'hidden md:block'
          }`}
        >
          <ChatTutor
            messages={messages}
            readingLevel={readingLevel}
            onChangeReadingLevel={setReadingLevel}
            isSocratic={isSocratic}
            onToggleSocratic={setIsSocratic}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onStopGeneration={handleStopGeneration}
            onSelectCitation={(cite) => setActiveCitation(cite)}
            hasDocuments={documents.length > 0}
          />
        </div>

        {/* Right Column: Study Studio (Quiz, Flashcards, Summary) */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            mobileTab === 'studio' ? 'block' : 'hidden lg:block'
          }`}
        >
          <StudyStudio
            quizzes={quizzes}
            flashcards={flashcards}
            onGenerateQuizzes={handleGenerateQuizzes}
            hasDocuments={documents.length > 0}
          />
        </div>
      </div>

      {/* Modals */}
      <SourceViewerModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      <PrivacyInfoModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}

export default App;
