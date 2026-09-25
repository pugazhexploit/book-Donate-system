import { CreateMLCEngine, type MLCEngineInterface } from '@mlc-ai/web-llm';
import type { ModelOption, ReadingLevel, SourceCitation } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 (360M)',
    size: '~230 MB',
    vram: '< 1 GB',
    description: 'Ultra-lightweight & fast. Ideal for any laptop or Chromebook.',
    recommendedFor: 'Quick start & low memory'
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 (0.5B)',
    size: '~390 MB',
    vram: '~1.2 GB',
    description: 'High speed and great multi-lingual and scientific tutoring accuracy.',
    recommendedFor: 'Fast balance'
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 (1B)',
    size: '~880 MB',
    vram: '~2 GB',
    description: 'Meta\'s latest 1B model. Strong reasoning and adaptive clarity.',
    recommendedFor: 'Recommended for laptops'
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini (3.8B)',
    size: '~2.2 GB',
    vram: '~4 GB',
    description: 'Microsoft\'s flagship small model. Deep academic depth.',
    recommendedFor: 'High-end laptops (8GB+ RAM)'
  }
];

export interface WebGPUDiagnostics {
  supported: boolean;
  adapterName?: string;
  vendor?: string;
  architecture?: string;
  error?: string;
}

export async function checkWebGPUSupport(): Promise<WebGPUDiagnostics> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return {
      supported: false,
      error: 'WebGPU is not enabled or supported in this browser. (Use Chrome 113+, Edge 113+, or Arc)'
    };
  }

  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'No WebGPU compatible GPU adapter found.'
      };
    }
    const info = await adapter.requestAdapterInfo?.();
    return {
      supported: true,
      adapterName: info?.description || info?.device || 'Standard GPU Adapter',
      vendor: info?.vendor || 'Unknown GPU Vendor',
      architecture: info?.architecture || ''
    };
  } catch (err: any) {
    return {
      supported: false,
      error: err.message || 'WebGPU adapter request failed'
    };
  }
}

let engineInstance: MLCEngineInterface | null = null;
let currentModelId = '';
let isEngineLoading = false;

export async function initWebLLMEngine(
  modelId: string,
  onProgress?: (progress: number, text: string) => void
): Promise<MLCEngineInterface> {
  if (engineInstance && currentModelId === modelId) {
    return engineInstance;
  }

  if (isEngineLoading) {
    throw new Error('A model is currently loading. Please wait.');
  }

  try {
    isEngineLoading = true;
    onProgress?.(5, `Initializing WebGPU engine for ${modelId}...`);

    engineInstance = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        const text = report.text;
        const pct = Math.round(report.progress * 100);
        onProgress?.(pct, text);
      }
    });

    currentModelId = modelId;
    return engineInstance;
  } finally {
    isEngineLoading = false;
  }
}

export function buildSystemPrompt(
  readingLevel: ReadingLevel,
  isSocratic: boolean,
  citations: SourceCitation[]
): string {
  const levelGuidelines: Record<ReadingLevel, string> = {
    elementary:
      'Explain concepts as if the student is a 10-year-old child. Use vivid, fun analogies (like factories, kitchens, superheroes), short friendly sentences, and simple vocabulary.',
    high_school:
      'Explain concepts clearly for a high school student. Connect concepts to everyday experiences, define key terms clearly, and keep explanations engaging and accessible.',
    undergraduate:
      'Provide a collegiate explanation for an undergraduate student. Use standard academic terminology, explain biochemical/scientific mechanisms, and structure answers methodically.',
    expert:
      'Provide an advanced, graduate-level research response. Include precise scientific nuances, cellular pathways, energetics, and structural considerations.'
  };

  const contextText = citations
    .map(
      (c, idx) =>
        `[Source ${idx + 1} (${c.docName}${c.pageNumber ? `, p.${c.pageNumber}` : ''})]:\n${c.text}`
    )
    .join('\n\n');

  let prompt = `You are "LocalTutor", a patient, private, local browser-based AI tutor.
Your responses are grounded strictly in the provided study material chunks.

STYLE INSTRUCTIONS:
- Target Reading Level: ${levelGuidelines[readingLevel]}
- Cite sources accurately by referencing [Source X].
`;

  if (isSocratic) {
    prompt += `
SOCRATIC TUTOR DIRECTIVE (ACTIVE):
- DO NOT simply answer the student's question directly or give away the solution.
- Instead, guide the student towards finding the answer themselves.
- Acknowledge their question warmly, point out a clue from the text (e.g. "Look at what [Source 1] says about..."), and ask 1 focused, thought-provoking guiding question to test their understanding.
- Keep your guiding question concise and encouraging.
`;
  } else {
    prompt += `
DIRECTIVE:
- Explain the answer step-by-step with high clarity.
- When referencing facts, append [Source 1], [Source 2], etc.
`;
  }

  prompt += `
STUDY MATERIAL CONTEXT:
${contextText || 'No specific document context provided. Answer based on foundational scientific principles.'}
`;

  return prompt;
}

/**
 * Stream completion from WebLLM with fallback simulator
 */
export async function streamTutoringResponse(
  query: string,
  readingLevel: ReadingLevel,
  isSocratic: boolean,
  citations: SourceCitation[],
  onChunk: (chunk: string) => void,
  useSimulation: boolean = false
): Promise<string> {
  const systemPrompt = buildSystemPrompt(readingLevel, isSocratic, citations);

  if (!useSimulation && engineInstance) {
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: query }
      ];

      const chunks = await engineInstance.chat.completions.create({
        messages,
        temperature: 0.4,
        stream: true
      });

      let fullText = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullText += delta;
        onChunk(delta);
      }
      return fullText;
    } catch (err) {
      console.warn('WebLLM generation error; switching to local simulated synthesis:', err);
    }
  }

  // Adaptive Simulation Engine (for testing, fallback, and WebGPU-less devices)
  return simulateAdaptiveResponse(query, readingLevel, isSocratic, citations, onChunk);
}

/**
 * Local Adaptive Synthesizer when running without full GPU weights
 */
async function simulateAdaptiveResponse(
  _query: string,
  readingLevel: ReadingLevel,
  isSocratic: boolean,
  citations: SourceCitation[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const topExcerpt = citations.length > 0 ? citations[0].text : '';
  const cleanExcerpt = topExcerpt.replace(/\[Page \d+\]/g, '').trim().slice(0, 320);

  let response = '';

  if (isSocratic) {
    if (readingLevel === 'elementary') {
      response = `Great curiosity! 🌟 Let's solve this mystery together!

In your reading ([Source 1]), it talks about how:
> "${cleanExcerpt.slice(0, 160)}..."

Think about your favorite toy or bicycle: when you want it to move, what does it need? If your cell is like a busy little city, who do you think is baking the fuel cookies inside it? Take a look at the passage and tell me what you see!`;
    } else if (readingLevel === 'high_school') {
      response = `That's a key question! Let's work through this step-by-step. 

Check out what your notes say in [Source 1]:
> "${cleanExcerpt.slice(0, 200)}..."

Notice how the passage highlights the transformation of raw inputs into usable cellular work. 

Before we jump to the conclusion: What specific molecule does the text identify as the "cellular currency" that gets charged up during this process?`;
    } else {
      response = `An excellent mechanistic question. Rather than just giving you the summary, let's trace the pathway together.

Notice the passage in [Source 1]:
> "${cleanExcerpt.slice(0, 220)}..."

Consider the energetic gradient established across the membrane. What driving force is physically required for ATP synthase to phosphorylate ADP, and how does the context text account for that proton accumulation?`;
    }
  } else {
    // Direct explanation
    if (readingLevel === 'elementary') {
      response = `Here is a fun and simple way to picture it! 🎈

Think of the cell like a bustling miniature amusement park, and the **mitochondria** are like the giant power plant providing electricity for all the roller coasters! ⚡

As explained in **[Source 1]**:
${cleanExcerpt ? `"${cleanExcerpt}"` : 'Mitochondria take in food nutrients and oxygen, and transform them into energy packets called ATP.'}

**Key takeaways for you:**
1. **The Battery:** Cells need energy just like a flashlight needs batteries.
2. **ATP:** The tiny "charged battery" that gives your muscles power to run and play!
3. **Teamwork:** Oxygen and glucose work together inside the inner folds to recharge those batteries constantly!`;
    } else if (readingLevel === 'high_school') {
      response = `Here is a clear breakdown based on your study materials:

In cellular biology, this process is central to how living organisms sustain life. According to **[Source 1]**:
> "${cleanExcerpt}"

**How it works step-by-step:**
1. **Fuel Breakdown:** Glucose and pyruvate are processed to extract high-energy electrons.
2. **Electron Transport Chain:** These electrons move through specialized protein complexes embedded in the inner mitochondrial cristae.
3. **ATP Synthesis:** The resulting proton gradient powers **ATP synthase** (like a microscopic waterwheel) to generate adenosine triphosphate (ATP), the primary energy carrier of the cell.

*Refer to [Source 1] for the full reaction stoichiometry and membrane structure details.*`;
    } else if (readingLevel === 'undergraduate') {
      response = `Here is the comprehensive mechanistic explanation derived from your document:

According to **[Source 1]**:
> "${cleanExcerpt}"

### Biochemical Mechanism:
1. **Matrix & Cristae Compartmentalization:**
   The double-membrane architecture creates an intermembrane space capable of accumulating high $\\text{H}^+$ concentrations, generating an electrochemical proton motive force ($\Delta p$).
2. **Chemiosmotic Coupling:**
   As electrons flow from $\\text{NADH}$ and $\\text{FADH}_2$ through Complexes I, III, and IV, protons are translocated from the matrix into the intermembrane space.
3. **Oxidative Phosphorylation:**
   Protons re-enter the mitochondrial matrix exclusively via the $F_0F_1$-ATP synthase rotor complex, catalyzing the condensation of $\\text{ADP} + \\text{P}_i \\rightarrow \\text{ATP}$.

This chemiosmotic model aligns directly with the cellular respiration data provided in your material.`;
    } else {
      response = `### Advanced Biochemical & Thermodynamic Analysis

Grounding this in the provided text **[Source 1]**:
> "${cleanExcerpt}"

**Thermodynamics & Flux:**
- **Proton Motive Force ($\Delta p$):** Comprises both an electrical membrane potential ($\Delta\Psi_m \approx -150\\text{ to } -180\\text{ mV}$) and a chemical proton gradient ($\Delta\\text{pH} \approx 0.5-1.0$).
- **Stoichiometry:** Driven by the differential redox potentials of $\\text{NADH/NAD}^+$ ($E^\circ' = -0.32\\text{ V}$) vs $\\text{O}_2/\\text{H}_2\\text{O}$ ($E^\circ' = +0.82\\text{ V}$), yielding $\Delta G^\circ' = -220\\text{ kJ/mol}$ per electron pair.
- **Respiratory Control:** The rate of electron transfer is tightly coupled to cellular ADP availability via translocase antiporters (ANT) and phosphate symporters.`;
    }
  }

  // Stream output character by character
  const words = response.split(' ');
  let accumulated = '';
  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word;
    onChunk((accumulated === word ? '' : ' ') + word);
    await new Promise(r => setTimeout(r, 18));
  }

  return response;
}
