// RAG Engine - Adapted for DataForge-Reader
// Provides semantic search and context retrieval for document analysis
// Enhanced with memory management for large document collections

interface DataForgeParagraph {
  id: string;
  page: number;
  paragraph_index: number;
  text: string;
  word_count: number;
  char_count: number;
  annotations: Record<string, unknown>;
  // Additional metadata fields
  sentence_count?: number;
  avg_word_length?: number;
  has_numbers?: boolean;
  has_special_chars?: boolean;
  starts_with_capital?: boolean;
  ends_with_punctuation?: boolean;
  is_question?: boolean;
  likely_heading?: boolean;
  likely_list_item?: boolean;
}

interface DataForgeDocument {
  file_id: string;
  filename: string;
  paragraphs: DataForgeParagraph[];
  total_pages: number;
  extraction_method: string;
}

interface RAGDocument {
  id: string;
  datasetId: string;
  datasetName: string;
  fullText: string;
  prompt: string;
  completion: string;
  intent: string;
  category: string;
  rowIndex: number;
  metadata: Record<string, unknown>;
}

interface EmbeddingResult {
  document: RAGDocument;
  similarity: number;
  relevanceScore: number;
}

interface BackendSearchResult {
  document: RAGDocument;
  similarity: number;
  relevanceScore: number;
}

interface BackendContextItem {
  source: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

interface SearchOptions {
  topK?: number;
  threshold?: number;
  datasetIds?: string[];
  searchIn?: 'fullText' | 'prompt' | 'completion';
  progressive?: boolean;
}

interface IRAGEngine {
  getStats(): RAGStats;
  search(query: string, options?: SearchOptions): Promise<EmbeddingResult[]>;
  buildPromptWithContext(query: string, systemPrompt: string, options?: SearchOptions): Promise<{
    prompt: string;
    context: Array<{
      source: string;
      content: string;
      relevanceScore: number;
    }>;
    hasContext: boolean;
    contextCount: number;
  }>;
  indexDocument(document: DataForgeDocument, onProgress?: (progress: number) => void): Promise<void>;
  removeDataset(datasetId: string): void;
  loadAvailableDatasets(): Promise<DatasetInfo[]>;
  indexExportedDataset(datasetId: string, datasetName?: string, onProgress?: (progress: number) => void): Promise<void>;
}

interface RAGStats {
  totalDocuments: number;
  indexedDatasets: number;
  datasetList: string[];
  storageSize: number;
  memoryUsage: {
    totalMB: number;
    usedMB: number;
    percentUsed: number;
  };
  isIndexing: boolean;
  indexingProgress: number;
}

interface ExportedDataset {
  id: string;
  name: string;
  data: Record<string, unknown>[];
  format: 'csv' | 'jsonl';
  row_count: number;
}

interface DatasetInfo {
  id: string;
  name: string;
  format: 'csv' | 'jsonl';
  row_count: number;
  filename: string;
}

class DataForgeRAGEngine {
  private documents: RAGDocument[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private indexedDatasets: Set<string> = new Set();
  private indexingProgress: number = 0;
  private chunkSize: number = 2000;

  // Performance optimization caches
  private embeddingCache: Map<string, number[]> = new Map();

  // Performance metrics
  private searchMetrics = {
    totalSearches: 0,
    totalTime: 0,
    avgResponseTime: 0,
    fastestSearch: Infinity,
    slowestSearch: 0
  };

  constructor(options: { maxMemoryUsage?: number; chunkSize?: number } = {}) {
    this.chunkSize = options.chunkSize || 2000;
  }

  // Convert DataForge document to RAG format
  private convertToRAGFormat(doc: DataForgeDocument): RAGDocument[] {
    return doc.paragraphs.map((paragraph, index) => ({
      id: paragraph.id,
      datasetId: doc.file_id,
      datasetName: doc.filename,
      fullText: paragraph.text,
      prompt: paragraph.text, // Use text as both prompt and completion for now
      completion: paragraph.text,
      intent: this.inferIntent(paragraph),
      category: this.inferCategory(paragraph),
      rowIndex: index,
      metadata: {
        page: paragraph.page,
        paragraph_index: paragraph.paragraph_index,
        word_count: paragraph.word_count,
        char_count: paragraph.char_count,
        annotations: paragraph.annotations,
        sentence_count: paragraph.sentence_count,
        avg_word_length: paragraph.avg_word_length,
        has_numbers: paragraph.has_numbers,
        has_special_chars: paragraph.has_special_chars,
        starts_with_capital: paragraph.starts_with_capital,
        ends_with_punctuation: paragraph.ends_with_punctuation,
        is_question: paragraph.is_question,
        likely_heading: paragraph.likely_heading,
        likely_list_item: paragraph.likely_list_item
      }
    }));
  }

  // Infer intent from paragraph metadata
  private inferIntent(paragraph: DataForgeParagraph): string {
    if (paragraph.likely_heading) return 'heading';
    if (paragraph.is_question) return 'question';
    if (paragraph.likely_list_item) return 'list_item';
    return 'content';
  }

  // Infer category from paragraph content and metadata
  private inferCategory(paragraph: DataForgeParagraph): string {
    if (paragraph.likely_heading) return 'heading';
    if (paragraph.likely_list_item) return 'list';
    if (paragraph.is_question) return 'question';
    return 'paragraph';
  }

  // Create simple embedding (placeholder - in real implementation, use proper embedding model)
  private async createEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;

    // Simple hash-based embedding for demo purposes
    // In production, replace with actual embedding model like OpenAI, Cohere, etc.
    const hash = this.simpleHash(text);
    const embedding = Array.from({ length: 384 }, (_, i) =>
      Math.sin(hash + i) * Math.cos(hash * 0.1 + i * 0.01)
    );

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / magnitude);

    // Cache the result
    if (this.embeddingCache.size < 1000) {
      this.embeddingCache.set(text, normalizedEmbedding);
    }

    return normalizedEmbedding;
  }

  // Simple hash function
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Index a DataForge document
  async indexDocument(doc: DataForgeDocument, onProgress?: (progress: number) => void): Promise<void> {
    // this.isIndexing = true;
    this.indexingProgress = 0;

    try {
      const ragDocuments = this.convertToRAGFormat(doc);

      // Process in chunks to avoid blocking
      const chunks = [];
      for (let i = 0; i < ragDocuments.length; i += this.chunkSize) {
        chunks.push(ragDocuments.slice(i, i + this.chunkSize));
      }

      let processed = 0;
      for (const chunk of chunks) {
        // Create embeddings for this chunk
        for (const document of chunk) {
          const embedding = await this.createEmbedding(document.fullText);
          this.embeddings.set(document.id, embedding);
          this.documents.push(document);
        }

        processed += chunk.length;
        this.indexingProgress = (processed / ragDocuments.length) * 100;

        if (onProgress) {
          onProgress(this.indexingProgress);
        }

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      this.indexedDatasets.add(doc.file_id);
      this.saveToStorage();

    } finally {
      // this.isIndexing = false;
      this.indexingProgress = 100;
    }
  }

  // Search documents using backend API
  async search(query: string, options: SearchOptions = {}): Promise<EmbeddingResult[]> {
    const searchStartTime = performance.now();

    const {
      topK = 5,
      threshold = 0.1,
      datasetIds = null,
      searchIn = 'fullText'
    } = options;

    console.log(`🔍 RAG Search: "${query}"`, { topK, threshold, searchIn });

    try {
      const searchRequest = {
        query,
        topK,
        threshold,
        datasetIds,
        searchIn
      };

      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('ℹ️ No search results found');
        return [];
      }

      // Convert backend results to frontend format
      const results: EmbeddingResult[] = data.results.map((result: BackendSearchResult) => ({
        document: result.document,
        similarity: result.similarity,
        relevanceScore: result.relevanceScore
      }));

      const searchTime = performance.now() - searchStartTime;
      this.updateSearchMetrics(searchTime);

      console.log(`✅ Backend search completed in ${searchTime.toFixed(2)}ms, found ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Search error:', error);
      const searchTime = performance.now() - searchStartTime;
      this.updateSearchMetrics(searchTime);
      return [];
    }
  }

  // Get context for RAG query using backend API
  async getContext(query: string, options: SearchOptions = {}): Promise<Array<{
    source: string;
    content: string;
    relevanceScore: number;
    metadata: Record<string, unknown>;
  }>> {
    try {
      const contextRequest = {
        query,
        topK: options.topK || 5,
        threshold: options.threshold || 0.1,
        datasetIds: options.datasetIds,
        searchIn: options.searchIn || 'fullText'
      };

      const response = await fetch('/api/rag/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextRequest)
      });

      if (!response.ok) {
        throw new Error(`Context retrieval failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.context || data.context.length === 0) {
        return [];
      }

      return data.context.map((item: BackendContextItem) => ({
        source: item.source,
        content: item.content,
        relevanceScore: item.relevanceScore,
        metadata: item.metadata || {}
      }));

    } catch (error) {
      console.error('❌ Context retrieval error:', error);
      return [];
    }
  }

  // Build prompt with RAG context
  async buildPromptWithContext(
    userQuery: string,
    systemPrompt: string = '',
    options: SearchOptions = {}
  ): Promise<{
    prompt: string;
    context: Array<{source: string; content: string; relevanceScore: number}>;
    hasContext: boolean;
    contextCount: number;
  }> {
    const context = await this.getContext(userQuery, options);

    if (context.length === 0) {
      return {
        prompt: `${systemPrompt}\n\nUser Query: ${userQuery}`,
        context: [],
        hasContext: false,
        contextCount: 0
      };
    }

    const contextSection = context
      .map((ctx, idx) =>
        `[Context ${idx + 1}] (Relevance: ${(ctx.relevanceScore * 100).toFixed(0)}%)\n` +
        `Source: ${ctx.source}\n` +
        `Content: ${ctx.content}\n`
      )
      .join('\n');

    const fullPrompt =
      `${systemPrompt}\n\n` +
      `Retrieved Context:\n${contextSection}\n` +
      `User Query: ${userQuery}\n\n` +
      `Please answer the user's query using the provided context when relevant.`;

    return {
      prompt: fullPrompt,
      context,
      hasContext: true,
      contextCount: context.length
    };
  }

  private updateSearchMetrics(searchTime: number): void {
    this.searchMetrics.totalSearches++;
    this.searchMetrics.totalTime += searchTime;
    this.searchMetrics.avgResponseTime = this.searchMetrics.totalTime / this.searchMetrics.totalSearches;
    this.searchMetrics.fastestSearch = Math.min(this.searchMetrics.fastestSearch, searchTime);
    this.searchMetrics.slowestSearch = Math.max(this.searchMetrics.slowestSearch, searchTime);
  }

  // Storage management
  private saveToStorage(): void {
    try {
      const data = {
        documents: this.documents,
        embeddings: Array.from(this.embeddings.entries()),
        indexedDatasets: Array.from(this.indexedDatasets),
        savedAt: new Date().toISOString()
      };

      // Check size before saving
      const dataSize = JSON.stringify(data).length;
      if (dataSize > 4 * 1024 * 1024) { // 4MB limit for localStorage
        console.warn('Data too large for localStorage, consider using IndexedDB');
        return;
      }

      localStorage.setItem('dataforge_rag_index', JSON.stringify(data));
      console.log(`💾 Saved RAG index: ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Failed to save RAG index:', error);
    }
  }

  async loadFromStorage(): Promise<boolean> {
    try {
      const data = localStorage.getItem('dataforge_rag_index');
      if (!data) return false;

      const parsed = JSON.parse(data);
      this.documents = parsed.documents || [];
      this.embeddings = new Map(parsed.embeddings || []);
      this.indexedDatasets = new Set(parsed.indexedDatasets || []);

      console.log(`✅ Loaded RAG index: ${this.documents.length} documents, ${this.indexedDatasets.size} datasets`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load RAG index:', error);
      return false;
    }
  }

  // Clear all data
  clear(): void {
    this.documents = [];
    this.embeddings.clear();
    this.indexedDatasets.clear();
    localStorage.removeItem('dataforge_rag_index');
  }

  // Get RAG statistics from backend
  async getStats(): Promise<RAGStats> {
    try {
      const response = await fetch('/api/rag/stats');
      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.statusText}`);
      }
      const data = await response.json();

      return {
        totalDocuments: data.stats.total_documents,
        indexedDatasets: data.stats.indexed_datasets,
        datasetList: data.indexed_datasets || [],
        storageSize: 0, // Not available from backend
        memoryUsage: {
          totalMB: 0,
          usedMB: 0,
          percentUsed: 0
        },
        isIndexing: false,
        indexingProgress: 0
      };
    } catch (error) {
      console.error('Error getting RAG stats:', error);
      return {
        totalDocuments: 0,
        indexedDatasets: 0,
        datasetList: [],
        storageSize: 0,
        memoryUsage: {
          totalMB: 0,
          usedMB: 0,
          percentUsed: 0
        },
        isIndexing: false,
        indexingProgress: 0
      };
    }
  }

  // Remove dataset
  removeDataset(datasetId: string): void {
    this.documents = this.documents.filter(doc => doc.datasetId !== datasetId);
    // Remove embeddings for this dataset
    for (const [id] of this.embeddings) {
      if (id.startsWith(`${datasetId}_`)) {
        this.embeddings.delete(id);
      }
    }
    this.indexedDatasets.delete(datasetId);
    this.saveToStorage();
  }

  // Load available exported datasets from backend
  async loadAvailableDatasets(): Promise<DatasetInfo[]> {
    try {
      const response = await fetch('/api/rag/available-datasets');
      if (!response.ok) {
        throw new Error(`Failed to load datasets: ${response.statusText}`);
      }
      const data = await response.json();
      return data.datasets || [];
    } catch (error) {
      console.error('Error loading available datasets:', error);
      return [];
    }
  }

  // Load and index an exported dataset
  async indexExportedDataset(datasetId: string, datasetName?: string, onProgress?: (progress: number) => void): Promise<void> {
    // this.isIndexing = true;
    this.indexingProgress = 0;

    try {
      // Index the dataset via backend API
      const response = await fetch('/api/rag/index-dataset-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: datasetId,
          dataset_name: datasetName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to index dataset: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Dataset indexed successfully:', result);

      // Update local stats
      this.indexedDatasets.add(datasetId);

      if (onProgress) {
        onProgress(100);
      }

    } catch (error) {
      console.error('Error indexing exported dataset:', error);
      throw error;
    } finally {
      // this.isIndexing = false;
      this.indexingProgress = 0;
    }
  }
}

// Singleton instance
const ragEngine = new DataForgeRAGEngine();

export default ragEngine;
export { DataForgeRAGEngine };
export type { DataForgeDocument, DataForgeParagraph, RAGDocument, EmbeddingResult, SearchOptions, RAGStats, IRAGEngine, ExportedDataset, DatasetInfo };