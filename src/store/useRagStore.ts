import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ollamaClient } from '../api/ollamaClient';
import { readTextFile, readPdfFile, splitTextIntoChunks, cosineSimilarity } from '../api/ragCore';

export interface DocumentVector {
  id: string;
  chunkId: string;
  text: string;
  embedding: number[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadTime: number;
}

interface RagState {
  isRagEnabled: boolean;
  embeddingModel: string;
  uploadedFiles: UploadedFile[];
  vectors: DocumentVector[];
  isProcessing: boolean;
  
  toggleRag: () => void;
  setEmbeddingModel: (model: string) => void;
  addDocument: (file: File) => Promise<void>;
  removeDocument: (id: string) => void;
  searchRelevantChunks: (query: string, topK?: number) => Promise<string[]>;
}

export const useRagStore = create<RagState>()(
  persist(
    (set, get) => ({
      isRagEnabled: false,
      embeddingModel: 'nomic-embed-text:latest',
      uploadedFiles: [],
      vectors: [],
      isProcessing: false,

      toggleRag: async () => {
        const willEnable = !get().isRagEnabled;
        set({ isRagEnabled: willEnable });
        
        // Auto-pull the embedding model if enabled
        if (willEnable) {
          const { useOllamaStore } = await import('./useOllamaStore');
          const ollamaStore = useOllamaStore.getState();
          const { embeddingModel } = get();
          
          const isDownloaded = ollamaStore.localModels.some(m => m.name === embeddingModel || m.name.startsWith(embeddingModel));
          if (!isDownloaded && !ollamaStore.pullingModels[embeddingModel]) {
            ollamaStore.startPullModel(embeddingModel);
          }
        }
      },
      setEmbeddingModel: (model) => set({ embeddingModel: model }),

      addDocument: async (file: File) => {
        set({ isProcessing: true });
        try {
          const docId = Date.now().toString();
          let fullText = '';

          if (file.type === 'application/pdf') {
            fullText = await readPdfFile(file);
          } else {
            fullText = await readTextFile(file);
          }

          const chunks = splitTextIntoChunks(fullText, 800);
          const newVectors: DocumentVector[] = [];
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await ollamaClient.fetchEmbeddings(get().embeddingModel, chunk);
            if (embedding) {
              newVectors.push({
                id: docId,
                chunkId: `${docId}-${i}`,
                text: chunk,
                embedding
              });
            }
          }

          set(state => ({
            uploadedFiles: [...state.uploadedFiles, {
              id: docId,
              name: file.name,
              size: file.size,
              uploadTime: Date.now()
            }],
            vectors: [...state.vectors, ...newVectors],
            isProcessing: false
          }));

        } catch (error) {
          console.error("Failed to add document to RAG:", error);
          set({ isProcessing: false });
        }
      },

      removeDocument: (id: string) => {
        set(state => ({
          uploadedFiles: state.uploadedFiles.filter(f => f.id !== id),
          vectors: state.vectors.filter(v => v.id !== id)
        }));
      },

      searchRelevantChunks: async (query: string, topK: number = 3) => {
        const { isRagEnabled, vectors, embeddingModel } = get();
        if (!isRagEnabled || vectors.length === 0) return [];

        const queryEmbedding = await ollamaClient.fetchEmbeddings(embeddingModel, query);
        if (!queryEmbedding) return [];

        const scoredChunks = vectors.map(vec => ({
          text: vec.text,
          score: cosineSimilarity(queryEmbedding, vec.embedding)
        }));

        scoredChunks.sort((a, b) => b.score - a.score);
        
        // Filter those above a certain threshold if desired, e.g., score > 0.3
        return scoredChunks.slice(0, topK).map(c => c.text);
      }
    }),
    {
      name: 'ning-rag-storage',
      partialize: (state) => ({
        isRagEnabled: state.isRagEnabled,
        embeddingModel: state.embeddingModel,
        uploadedFiles: state.uploadedFiles,
        vectors: state.vectors
      }),
    }
  )
);
