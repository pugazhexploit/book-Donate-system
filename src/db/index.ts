import Dexie, { type Table } from 'dexie';
import type { DocumentItem, DocumentChunk, ChatMessage, QuizQuestion, Flashcard } from '../types';

export class LocalTutorDatabase extends Dexie {
  documents!: Table<DocumentItem, string>;
  chunks!: Table<DocumentChunk, string>;
  chats!: Table<ChatMessage, string>;
  quizzes!: Table<QuizQuestion, string>;
  flashcards!: Table<Flashcard, string>;

  constructor() {
    super('LocalTutorDB');
    this.version(1).stores({
      documents: 'id, name, type, uploadedAt',
      chunks: 'id, docId, docName, chunkIndex',
      chats: 'id, timestamp, role',
      quizzes: 'id, docId',
      flashcards: 'id, docId'
    });
  }
}

export const db = new LocalTutorDatabase();

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', db.documents, db.chunks, db.chats, db.quizzes, db.flashcards, async () => {
    await db.documents.clear();
    await db.chunks.clear();
    await db.chats.clear();
    await db.quizzes.clear();
    await db.flashcards.clear();
  });
}
