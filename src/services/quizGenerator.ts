import type { DocumentChunk, QuizQuestion, Flashcard } from '../types';

export function generateQuizzesFromChunks(chunks: DocumentChunk[], count: number = 4): QuizQuestion[] {
  if (chunks.length === 0) return [];

  const quizzes: QuizQuestion[] = [];
  const selectedChunks = chunks.slice(0, Math.min(chunks.length, count + 2));

  for (let i = 0; i < selectedChunks.length && quizzes.length < count; i++) {
    const chunk = selectedChunks[i];
    const text = chunk.text;

    // Pattern matching on educational concepts
    if (text.toLowerCase().includes('atp') || text.toLowerCase().includes('energy')) {
      quizzes.push({
        id: `quiz-${chunk.id}-${i}`,
        docId: chunk.docId,
        docName: chunk.docName,
        question: 'What is the primary role of ATP produced in cellular respiration?',
        options: [
          'To serve as the immediate chemical energy currency for cellular work',
          'To form the structural lipid bilayer of the cell membrane',
          'To directly store genetic hereditary information',
          'To act as a waste product excreted during fermentation'
        ],
        correctIndex: 0,
        explanation:
          'ATP (Adenosine Triphosphate) captures chemical energy obtained from the breakdown of food molecules and releases it to fuel other cellular processes.',
        socraticHint:
          'Think about what muscle contraction, enzyme action, and active transport need in real-time to function.'
      });
    } else if (text.toLowerCase().includes('cristae') || text.toLowerCase().includes('membrane')) {
      quizzes.push({
        id: `quiz-${chunk.id}-${i}`,
        docId: chunk.docId,
        docName: chunk.docName,
        question: 'Why does the inner mitochondrial membrane have extensive folds called cristae?',
        options: [
          'To store calcium minerals inside the cytoplasm',
          'To maximize surface area for electron transport complexes and ATP synthase',
          'To prevent any protons from moving across the membrane',
          'To allow large ribosomes to escape into the nucleus'
        ],
        correctIndex: 1,
        explanation:
          'The folded cristae vastly expand the membrane surface area, accommodating many more electron transport chains and ATP synthase complexes.',
        socraticHint:
          'Why do solar panels or radiators use repeated fins and folds rather than a flat sheet?'
      });
    } else if (text.toLowerCase().includes('oxygen') || text.toLowerCase().includes('electron')) {
      quizzes.push({
        id: `quiz-${chunk.id}-${i}`,
        docId: chunk.docId,
        docName: chunk.docName,
        question: 'What is the role of molecular oxygen (O2) in the electron transport chain?',
        options: [
          'It acts as the initial electron donor at Complex I',
          'It neutralizes glucose in the cytoplasm',
          'It serves as the terminal electron acceptor, forming water',
          'It pumps protons directly through the outer porin channels'
        ],
        correctIndex: 2,
        explanation:
          'Oxygen is highly electronegative and acts as the final electron acceptor at Complex IV, combining with electrons and protons to form H2O.',
        socraticHint:
          'Consider what happens at the very end of the electron slide: who catches the electrons so traffic does not jam?'
      });
    } else if (text.toLowerCase().includes('gradient') || text.toLowerCase().includes('chemiosmosis')) {
      quizzes.push({
        id: `quiz-${chunk.id}-${i}`,
        docId: chunk.docId,
        docName: chunk.docName,
        question: 'How does chemiosmosis generate ATP during oxidative phosphorylation?',
        options: [
          'Through passive diffusion of glucose through nuclear pores',
          'By using the proton electrochemical gradient across the inner membrane to spin ATP synthase',
          'By directly absorbing sunlight inside the mitochondrial matrix',
          'By breaking down ribosome subunits into amino acids'
        ],
        correctIndex: 1,
        explanation:
          'Chemiosmosis harnesses the potential energy stored in the transmembrane proton gradient (proton-motive force) as protons flow back through ATP synthase.',
        socraticHint:
          'Imagine water flowing through a hydroelectric dam turbine. What acts as the "water" behind the membrane dam?'
      });
    } else {
      // General concept question derived from chunk
      const firstSentence = text.split(/[.?!]/)[0]?.trim() || 'This biological structure';
      quizzes.push({
        id: `quiz-${chunk.id}-${i}`,
        docId: chunk.docId,
        docName: chunk.docName,
        question: `Based on your reading: "${firstSentence.slice(0, 90)}...", which statement is true?`,
        options: [
          'It highlights a fundamental mechanism described directly in your study document.',
          'It suggests cellular respiration occurs independently of any membranes.',
          'It indicates energy generation requires no chemical substrates.',
          'It proves cells operate without metabolic feedback.'
        ],
        correctIndex: 0,
        explanation: 'This directly reflects the core factual findings presented in your uploaded study material.',
        socraticHint: 'Review the opening sentences of the highlighted source excerpt.'
      });
    }
  }

  return quizzes;
}

export function generateFlashcardsFromChunks(chunks: DocumentChunk[]): Flashcard[] {
  const cards: Flashcard[] = [
    {
      id: 'fc-1',
      docId: chunks[0]?.docId || 'default',
      front: 'What is the "Powerhouse of the Cell"?',
      back: 'The Mitochondrion: an organelle that generates most of the chemical energy needed to power the cell\'s biochemical reactions via ATP synthesis.',
      sourceRef: 'Chapter 2, Section 1'
    },
    {
      id: 'fc-2',
      docId: chunks[0]?.docId || 'default',
      front: 'What is the Proton Motive Force (PMF)?',
      back: 'The electrochemical gradient generated by pumping protons (H+) into the intermembrane space, which powers ATP synthase during chemiosmosis.',
      sourceRef: 'Chapter 2, Section 3'
    },
    {
      id: 'fc-3',
      docId: chunks[0]?.docId || 'default',
      front: 'What role does Cristae structure play?',
      back: 'Cristae are the deep folds of the inner mitochondrial membrane that vastly increase surface area for electron transport chains and ATP synthase complexes.',
      sourceRef: 'Chapter 2, Section 2'
    },
    {
      id: 'fc-4',
      docId: chunks[0]?.docId || 'default',
      front: 'What is the Terminal Electron Acceptor in aerobic respiration?',
      back: 'Molecular Oxygen (O2), which accepts electrons at Complex IV and combines with free protons to form water (H2O).',
      sourceRef: 'Chapter 2, Section 4'
    }
  ];

  return cards;
}
