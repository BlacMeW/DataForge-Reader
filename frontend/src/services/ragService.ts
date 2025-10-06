/**
 * RAG Service - Background service for DataForge RAG Engine
 *
 * This service lazy loads the RAG engine as a background process,
 * allowing the UI to render immediately while heavy initialization happens asynchronously.
 */

// NOTE: DataForgeRAGEngine implementation will be dynamically imported inside
// getRagEngine() to keep the main bundle smaller. We expose a minimal local
// interface here for type-checking without importing the heavy module.

interface DataForgeRAGEngine {
  search(query: string, options?: { topK?: number; threshold?: number; searchIn?: string }): Promise<Array<{ document: unknown; similarity: number; relevanceScore: number }>>;
  buildPromptWithContext(query: string, systemPrompt?: string, options?: { topK?: number; threshold?: number; searchIn?: string }): Promise<{ prompt: string; context: Array<{ source: string; content: string; relevanceScore: number }>; hasContext: boolean; contextCount: number }>;
  loadFromStorage?: () => Promise<void>;
}

let ragEngineInstance: DataForgeRAGEngine | null = null;
let ragEnginePromise: Promise<DataForgeRAGEngine> | null = null;
let isInitializing = false;
let initCallbacks: Array<(engine: DataForgeRAGEngine) => void> = [];

/**
 * Get RAG Engine instance (lazy loads on first call)
 * @returns {Promise<DataForgeRAGEngine>} RAG Engine instance
 */
export async function getRagEngine(): Promise<DataForgeRAGEngine> {
  // If already initialized, return immediately
  if (ragEngineInstance) {
    console.log('✅ RAG Engine: Using cached instance');
    return ragEngineInstance;
  }

  // If initialization in progress, wait for it
  if (ragEnginePromise) {
    console.log('⏳ RAG Engine: Waiting for initialization...');
    return ragEnginePromise;
  }

  // Start initialization
  console.log('🚀 RAG Engine: Starting background initialization...');
  isInitializing = true;

  ragEnginePromise = (async () => {
    try {
      const startTime = performance.now();

      // Dynamic import - loads RAG engine implementation only when needed.
      // This creates a separate chunk for the heavy engine code instead of
      // bundling it into the main application bundle.
      const module = await import('../utils/ragEngine');
      // The module is expected to export a class named `DataForgeRAGEngine`.
  type EngineCtor = new (...args: unknown[]) => DataForgeRAGEngine;
      const engineExport = (module as unknown) as { DataForgeRAGEngine?: EngineCtor };
      if (!engineExport || typeof engineExport.DataForgeRAGEngine !== 'function') {
        throw new Error('RAG engine module does not export DataForgeRAGEngine');
      }
      const EngineClassCtor = engineExport.DataForgeRAGEngine as EngineCtor;
      const ragEngine: DataForgeRAGEngine = new EngineClassCtor();

      const loadTime = performance.now() - startTime;
      console.log(`✅ RAG Engine: Loaded in ${loadTime.toFixed(2)}ms`);

      // Auto-load persisted data in background (if method exists)
      try {
        if (typeof ragEngine.loadFromStorage === 'function') {
          await ragEngine.loadFromStorage();
          console.log('✅ RAG Engine: Auto-loaded persisted data');
        } else {
          console.log('ℹ️ RAG Engine: No loadFromStorage method (will load on demand)');
        }
      } catch (error) {
        console.warn('⚠️ RAG Engine: Auto-load failed (this is OK):', error instanceof Error ? error.message : String(error));
      }

      ragEngineInstance = ragEngine;
      isInitializing = false;

      // Notify all waiting callbacks
      initCallbacks.forEach(callback => callback(ragEngine));
      initCallbacks = [];

      return ragEngine;
    } catch (error) {
      console.error('❌ RAG Engine initialization failed:', error);
      isInitializing = false;
      ragEnginePromise = null;
      throw error;
    }
  })();

  return ragEnginePromise;
}

/**
 * Check if RAG engine is ready (non-blocking)
 * @returns {boolean} True if engine is loaded and ready
 */
export function isRagEngineReady(): boolean {
  return ragEngineInstance !== null;
}

/**
 * Check if RAG engine is currently initializing
 * @returns {boolean} True if initialization in progress
 */
export function isRagEngineInitializing(): boolean {
  return isInitializing;
}

/**
 * Subscribe to RAG engine initialization
 * @param {Function} callback - Called when engine is ready
 * @returns {Function} Unsubscribe function
 */
export function onRagEngineReady(callback: (engine: DataForgeRAGEngine) => void): () => void {
  if (ragEngineInstance) {
    // Already ready, call immediately
    callback(ragEngineInstance);
    return () => {}; // No-op unsubscribe
  }

  // Add to callbacks
  initCallbacks.push(callback);

  // Start loading if not already
  if (!ragEnginePromise) {
    getRagEngine().catch(error => {
      console.error('Failed to initialize RAG engine:', error);
    });
  }

  // Return unsubscribe function
  return () => {
    const index = initCallbacks.indexOf(callback);
    if (index > -1) {
      initCallbacks.splice(index, 1);
    }
  };
}

/**
 * Preload RAG engine (fire-and-forget)
 * Call this early in app lifecycle to start loading in background
 */
export function preloadRagEngine(): void {
  if (!ragEngineInstance && !ragEnginePromise) {
    console.log('🔄 RAG Engine: Starting preload...');
    getRagEngine().catch(error => {
      console.error('RAG engine preload failed:', error);
    });
  }
}

/**
 * Get RAG engine synchronously (returns null if not ready)
 * Use this for non-critical features that can wait
 * @returns {DataForgeRAGEngine|null} RAG Engine instance or null
 */
export function getRagEngineSync(): DataForgeRAGEngine | null {
  return ragEngineInstance;
}

/**
 * Reset RAG engine (for testing/debugging)
 */
export function resetRagEngine(): void {
  console.log('🔄 RAG Engine: Resetting...');
  ragEngineInstance = null;
  ragEnginePromise = null;
  isInitializing = false;
  initCallbacks = [];
}

// Export default object with all methods
export default {
  getRagEngine,
  isRagEngineReady,
  isRagEngineInitializing,
  onRagEngineReady,
  preloadRagEngine,
  getRagEngineSync,
  resetRagEngine,
};