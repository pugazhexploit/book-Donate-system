import type { DocumentChunk, SourceCitation } from '../types';

let extractorInstance: any = null;
let isInitializing = false;
let initProgressCallback: ((progress: number, text: string) => void) | null = null;

export function setEmbeddingProgressCallback(cb: (progress: number, text: string) => void) {
  initProgressCallback = cb;
}

export async function getEmbeddingPipeline() {
  if (extractorInstance) return extractorInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return extractorInstance;
  }

  try {
    isInitializing = true;
    if (initProgressCallback) initProgressCallback(10, 'Initializing Transformers.js WASM...');

    // Dynamic import to avoid SSR / bundler evaluation issues
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'fp32',
      progress_callback: (data: any) => {
        if (data.status === 'progress' && initProgressCallback) {
          const pct = Math.round((data.loaded / data.total) * 100) || 50;
          initProgressCallback(pct, `Loading all-MiniLM-L6-v2 (${data.file || ''}): ${pct}%`);
        }
      }
    });

    if (initProgressCallback) initProgressCallback(100, 'Embedding model ready!');
    return extractorInstance;
  } catch (err) {
    console.warn('Transformers.js load issue; using fast semantic vectorizer:', err);
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate 384-dim normalized embedding for a string
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const pipe = await getEmbeddingPipeline();
    if (!pipe) {
      return generateFallbackVector(text);
    }
    // Truncate text to avoid token limits for embedding
    const truncated = text.slice(0, 1000);
    const output = await pipe(truncated, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('Embedding error, falling back to heuristic vector:', err);
    return generateFallbackVector(text);
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fast semantic/TF-IDF pseudo-vector fallback (384 dimensions)
 */
function generateFallbackVector(text: string): number[] {
  const dim = 384;
  const vec = new Float32Array(dim);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }

  // Normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vec[i] /= norm;

  return Array.from(vec);
}

/**
 * Search chunks using Cosine Similarity on embeddings
 */
export async function searchRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): Promise<SourceCitation[]> {
  if (chunks.length === 0) return [];

  const queryVec = await generateEmbedding(query);
  if (!queryVec) return [];

  const scored = chunks.map(chunk => {
    let score = 0;
    if (chunk.embedding && chunk.embedding.length > 0) {
      score = cosineSimilarity(queryVec, chunk.embedding);
    } else {
      // Keyword overlap bonus
      const qWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      let matches = 0;
      for (const w of qWords) {
        if (chunk.text.toLowerCase().includes(w)) matches++;
      }
      score = (matches / Math.max(1, qWords.size)) * 0.7;
    }

    return {
      chunkId: chunk.id,
      docName: chunk.docName,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      similarity: score
    };
  });

  // Sort descending by similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}
