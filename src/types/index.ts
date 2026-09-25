export type ReadingLevel = 'elementary' | 'high_school' | 'undergraduate' | 'expert';

export interface DocumentItem {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'sample';
  size: number;
  pageCount?: number;
  uploadedAt: number;
  chunkCount: number;
  summary?: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  embedding?: number[];
  tokenEstimate: number;
}

export interface SourceCitation {
  chunkId: string;
  docName: string;
  chunkIndex: number;
  pageNumber?: number;
  text: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  citations?: SourceCitation[];
  readingLevel?: ReadingLevel;
  isSocratic?: boolean;
}

export interface QuizQuestion {
  id: string;
  docId: string;
  docName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  socraticHint: string;
  userSelectedIndex?: number;
  isAnswered?: boolean;
}

export interface Flashcard {
  id: string;
  docId: string;
  front: string;
  back: string;
  sourceRef?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  size: string;
  vram: string;
  description: string;
  recommendedFor: string;
}

export interface EngineProgress {
  progress: number;
  text: string;
  isLoading: boolean;
}
