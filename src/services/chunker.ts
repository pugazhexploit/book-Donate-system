import type { DocumentChunk } from '../types';

export interface ChunkOptions {
  wordsPerChunk?: number;
  wordOverlap?: number;
}

export function chunkText(
  text: string,
  docId: string,
  docName: string,
  options: ChunkOptions = {}
): DocumentChunk[] {
  const { wordsPerChunk = 250, wordOverlap = 40 } = options;

  // Split into paragraphs first to avoid awkward breaks
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks: DocumentChunk[] = [];
  let currentWords: string[] = [];
  let chunkCounter = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(w => w.length > 0);

    if (currentWords.length + paraWords.length <= wordsPerChunk) {
      currentWords.push(...paraWords);
    } else {
      if (currentWords.length > 0) {
        const chunkContent = currentWords.join(' ');
        chunks.push({
          id: `${docId}-chunk-${chunkCounter}`,
          docId,
          docName,
          chunkIndex: chunkCounter,
          text: chunkContent,
          tokenEstimate: Math.round(currentWords.length * 1.3)
        });
        chunkCounter++;

        // Keep overlap words from the end
        const overlapCount = Math.min(wordOverlap, currentWords.length);
        const overlap = currentWords.slice(currentWords.length - overlapCount);
        currentWords = [...overlap, ...paraWords];
      } else {
        // Single paragraph larger than wordsPerChunk
        for (let i = 0; i < paraWords.length; i += (wordsPerChunk - wordOverlap)) {
          const slice = paraWords.slice(i, i + wordsPerChunk);
          chunks.push({
            id: `${docId}-chunk-${chunkCounter}`,
            docId,
            docName,
            chunkIndex: chunkCounter,
            text: slice.join(' '),
            tokenEstimate: Math.round(slice.length * 1.3)
          });
          chunkCounter++;
        }
        currentWords = [];
      }
    }
  }

  // Final flush
  if (currentWords.length > 0) {
    chunks.push({
      id: `${docId}-chunk-${chunkCounter}`,
      docId,
      docName,
      chunkIndex: chunkCounter,
      text: currentWords.join(' '),
      tokenEstimate: Math.round(currentWords.length * 1.3)
    });
  }

  return chunks;
}
