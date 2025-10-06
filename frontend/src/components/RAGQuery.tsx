import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, Search, Settings, FileSearch, Clipboard, X } from 'lucide-react';
import { preloadRagEngine, getRagEngineSync, onRagEngineReady } from '../services/ragService';

interface ContextResult {
  prompt: string;
  context: Array<{
    source: string;
    content: string;
    relevanceScore: number;
  }>;
  hasContext: boolean;
  contextCount: number;
}

interface SearchResult {
  document: {
    id: string;
    datasetId: string;
    datasetName: string;
    fullText: string;
    prompt: string;
    completion: string;
    intent: string;
    category: string;
    rowIndex: number;
    metadata: { [key: string]: unknown };
  };
  similarity: number;
  relevanceScore: number;
}

interface RAGStats {
  total_documents: number;
  indexed_datasets: number;
  last_updated: string;
}

interface IndexedDataset {
  datasetId: string;
  datasetName: string;
  documentCount: number;
  category: string;
}

interface SearchResponse {
  results: SearchResult[];
  total_results: number;
  query: string;
  search_parameters: {
    topK: number;
    threshold: number;
    datasetIds?: string[];
    searchIn: string;
  };
}

interface ContextResponse {
  prompt: string;
  context: Array<{
    source: string;
    content: string;
    relevanceScore: number;
  }>;
  hasContext: boolean;
  contextCount: number;
}

export default function RAGQuery({ onClose, forceApi }: { onClose?: () => void; forceApi?: boolean } = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [context, setContext] = useState<ContextResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [totalEmbeddings, setTotalEmbeddings] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Indexed datasets
  const [indexedDatasets, setIndexedDatasets] = useState<IndexedDataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  // Basic Settings
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.1);
  const [searchIn, setSearchIn] = useState<'fullText' | 'prompt' | 'completion'>('fullText');
  const [showSettings, setShowSettings] = useState(false);
  const [showRelevanceScores, setShowRelevanceScores] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  // Memory Management & Safety
  const abortControllerRef = useRef<AbortController | null>(null);
  // API base and prefix (use VITE_API_BASE_URL when set, otherwise default to localhost)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  const apiPrefix = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const loadStats = useCallback(async () => {
    try {
      // use the already-computed apiPrefix above
      const response = await fetch(`${apiPrefix}/rag/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        // API returns total_embeddings at the top level; store separately
        setTotalEmbeddings(data.total_embeddings ?? null);
      }
    } catch (error) {
      console.warn('Could not load stats:', error);
    }
  }, [apiPrefix]);

  const loadIndexedDatasets = useCallback(async () => {
    try {
      const response = await fetch(`${apiPrefix}/rag/indexed-datasets`);
      if (response.ok) {
        const data = await response.json();
        setIndexedDatasets(data.indexed_datasets || []);
      }
    } catch (error) {
      console.warn('Could not load indexed datasets:', error);
    }
  }, [apiPrefix]);

  // Initialize component
  useEffect(() => {
    console.log('✅ RAG Query page loaded - connecting to backend API...');
    loadStats();
    loadIndexedDatasets();
    // Start preloading client-side RAG engine in background
    try { preloadRagEngine(); } catch { /* ignore */ }

    // optional: when engine ready, log
    const unsub = onRagEngineReady(() => console.log('✅ RAG engine ready (UI can use fast-path)'));
    return () => unsub();
  }, [loadStats, loadIndexedDatasets]);

  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 5000); // Update stats every 5 seconds

    return () => clearInterval(interval);
  }, [loadStats]);

  // Focus management and Escape-to-close (restore focus on unmount)
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    // focus the input when modal opens
    setTimeout(() => inputRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) onClose(); else window.history.back();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      try { previousActiveElementRef.current?.focus(); } catch { /* ignore */ }
    };
  }, [onClose]);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    if (!stats || stats.total_documents === 0) {
      alert('⚠️ No documents indexed yet!\n\nPlease:\n1. Go to document processing\n2. Parse some documents\n3. Index them for RAG search\n4. Then try searching again');
      return;
    }

    // Abort previous search if still running
    if (abortControllerRef.current) {
      console.log('🛑 Aborting previous search...');
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    const searchStartTime = Date.now();

    try {
      const searchOptions = {
        topK,
        threshold,
        searchIn,
        datasetIds: selectedDatasets.length > 0 ? selectedDatasets : undefined
      };

      console.log('🔍 Starting RAG search (fast-path if engine ready) with options:', searchOptions);

  // Fast-path: use client-side engine if loaded and not forced to use API
  const engine = !forceApi ? getRagEngineSync() : null;
  if (engine) {
        console.log('⚡ Using client-side RAG engine');
        const engineResults = await engine.search(query, searchOptions);
        // engineResults: EmbeddingResult[] -> map to SearchResult
        const mapped: SearchResult[] = engineResults.map(r => ({
          document: r.document as unknown as SearchResult['document'],
          similarity: r.similarity,
          relevanceScore: r.relevanceScore
        }));
        setResults(mapped);
        const promptData = await engine.buildPromptWithContext(query, '', searchOptions);
        setContext({ prompt: promptData.prompt, context: promptData.context, hasContext: promptData.hasContext, contextCount: promptData.contextCount });
        const searchTime = Date.now() - searchStartTime;
        console.log(`✅ Client search completed in ${searchTime}ms, found ${mapped.length} results`);
      } else {
        // Fallback to server API
  const response = await fetch(`${apiPrefix}/rag/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, ...searchOptions }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const searchData: SearchResponse = await response.json();
        setResults(searchData.results);
        const searchTime = Date.now() - searchStartTime;
        console.log(`✅ Server search completed in ${searchTime}ms, found ${searchData.results.length} results`);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Search was cancelled');
      } else {
        alert('Search failed: ' + (error instanceof Error ? error.message : String(error)));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleBuildContext = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    if (!stats || stats.total_documents === 0) {
      alert('⚠️ No documents indexed yet! Please index some documents first.');
      return;
    }

    setLoading(true);
    try {
      const options = { topK, threshold, searchIn };
  const engine = !forceApi ? getRagEngineSync() : null;
  if (engine) {
        const promptData = await engine.buildPromptWithContext(query, '', options);
        setContext({ prompt: promptData.prompt, context: promptData.context, hasContext: promptData.hasContext, contextCount: promptData.contextCount });
        if (!promptData.hasContext) {
          alert(`No relevant context found for "${query}"\n\nTips:\n• Try different keywords\n• Lower the similarity threshold\n• Make sure relevant documents are indexed`);
        }
      } else {
  const contextOptions = { query, topK, threshold, searchIn };
  const response = await fetch(`${apiPrefix}/rag/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextOptions)
        });

        if (!response.ok) throw new Error(`Context building failed: ${response.statusText}`);
        const contextData: ContextResponse = await response.json();
        if (!contextData.hasContext) {
          alert(`No relevant context found for "${query}"\n\nTips:\n• Try different keywords\n• Lower the similarity threshold\n• Make sure relevant documents are indexed`);
        }
        setContext(contextData);
      }
    } catch (error) {
      console.error('Context generation error:', error);
      alert('Context generation failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // show a small transient toast
      setCopiedMessage('Copied to clipboard');
      setTimeout(() => setCopiedMessage(null), 1800);
      console.log('Copied to clipboard');
    }).catch(() => {
      setCopiedMessage('Copy failed');
      setTimeout(() => setCopiedMessage(null), 1800);
    });
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      {/* small transient toast */}
      {copiedMessage && (
        <div style={{ position: 'fixed', top: '18px', right: '18px', background: '#111827', color: 'white', padding: '8px 12px', borderRadius: '8px', zIndex: 1100 }}>
          {copiedMessage}
        </div>
      )}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '1100px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={28} color="#8b5cf6" />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>RAG Query Engine</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                Search and analyze your documents with AI-powered retrieval
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose ? onClose() : window.history.back()}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={22} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Top stats row */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>{stats.total_documents}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Documents</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{stats.indexed_datasets}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Datasets</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Never'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Last Updated</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f97316' }}>{totalEmbeddings ?? stats.total_documents}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Embeddings</div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {results.length} results • showing top {Math.min(results.length, topK)}
              {selectedDatasets.length > 0 && ` • filtered by ${selectedDatasets.length} dataset(s)`}
            </div>
          )}

          {/* Dataset Filter */}
          {indexedDatasets.length > 0 && (
            <div style={{ 
              background: '#f8fafc', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                Filter by Dataset ({indexedDatasets.length} available)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => setSelectedDatasets([])}
                  style={{
                    padding: '6px 12px',
                    background: selectedDatasets.length === 0 ? '#1e40af' : 'white',
                    color: selectedDatasets.length === 0 ? 'white' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  All Datasets
                </button>
                {indexedDatasets.map(ds => (
                  <button
                    key={ds.datasetId}
                    onClick={() => {
                      setSelectedDatasets(prev => 
                        prev.includes(ds.datasetId)
                          ? prev.filter(id => id !== ds.datasetId)
                          : [...prev, ds.datasetId]
                      );
                    }}
                    style={{
                      padding: '6px 12px',
                      background: selectedDatasets.includes(ds.datasetId) ? '#1e40af' : 'white',
                      color: selectedDatasets.includes(ds.datasetId) ? 'white' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {ds.datasetName}
                    <span style={{ 
                      fontSize: '11px', 
                      opacity: 0.8,
                      background: selectedDatasets.includes(ds.datasetId) ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {ds.documentCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search & controls */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e6e7eb' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter your search query..."
                style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
              />
              <button onClick={handleSearch} disabled={loading} style={{ padding: '10px 14px', background: '#7c3aed', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
              <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e6e7eb', background: 'transparent' }}>
                <Settings />
              </button>
              <button onClick={handleBuildContext} disabled={loading} style={{ padding: '10px 12px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FileSearch />
                <span>Build Context</span>
              </button>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#374151' }}>Top K Results</label>
                    <input type="number" value={topK} onChange={(e) => setTopK(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={50} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#374151' }}>Similarity Threshold</label>
                    <input type="number" value={threshold} onChange={(e) => setThreshold(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))} min={0} max={1} step={0.01} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#374151' }}>Search In</label>
                    <select value={searchIn} onChange={(e) => setSearchIn(e.target.value as 'fullText' | 'prompt' | 'completion')} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                      <option value="fullText">Full Text</option>
                      <option value="prompt">Prompt</option>
                      <option value="completion">Completion</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={showRelevanceScores} onChange={(e) => setShowRelevanceScores(e.target.checked)} />
                    <span style={{ fontSize: '13px' }}>Show Relevance Scores</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)} />
                    <span style={{ fontSize: '13px' }}>Include Metadata</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Results & Context area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '16px' }}>
            <div style={{ overflow: 'auto', maxHeight: '50vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.length > 0 ? results.map((result, idx) => (
                <div key={idx} style={{ border: '1px solid #e6e7eb', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>{result.document.datasetName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Page {result.document.metadata.page as number}</div>
                        {showRelevanceScores && <div style={{ marginLeft: 'auto', color: '#059669', fontWeight: 600 }}>{(result.relevanceScore * 100).toFixed(1)}% relevant</div>}
                      </div>
                      <div style={{ color: '#111827' }}>{result.document.fullText}</div>
                    </div>
                    <button onClick={() => copyToClipboard(result.document.fullText)} style={{ marginLeft: '12px', padding: '8px', borderRadius: '6px', border: '1px solid #e6e7eb', background: 'transparent' }}>
                      <Clipboard />
                    </button>
                  </div>
                  {includeMetadata && <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>Words: {result.document.metadata.word_count as number} | Chars: {result.document.metadata.char_count as number}</div>}
                </div>
              )) : (
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px dashed #e6e7eb', color: '#6b7280' }}>
                  No results yet — try running a search.
                </div>
              )}
            </div>

            <div style={{ overflow: 'auto', maxHeight: '50vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ border: '1px solid #e6e7eb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>Generated Context{context ? ` (${context.contextCount})` : ''}</div>
                  {context && <button onClick={() => copyToClipboard(context.prompt)} style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#e5e7eb' }}><Clipboard /></button>}
                </div>
                {context ? (
                  <div style={{ marginTop: '8px' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#111827' }}>{context.prompt}</pre>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {context.context.map((c, i) => (
                        <div key={i} style={{ border: '1px solid #f3f4f6', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ fontSize: '12px', color: '#2563eb' }}>{c.source}</div>
                            <div style={{ fontSize: '12px', color: '#059669' }}>{(c.relevanceScore * 100).toFixed(1)}%</div>
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151' }}>{c.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', color: '#6b7280' }}>No context generated. Use "Build Context" to generate a prompt from search results.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#6b7280' }}>{results.length} results • {context ? `${context.contextCount} context items` : 'no context'}</div>
            <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { copyToClipboard(JSON.stringify(results, null, 2)); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e6e7eb', background: 'white' }}>Export JSON</button>
            <button onClick={() => onClose ? onClose() : window.history.back()} style={{ padding: '8px 14px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none' }}>{'Close'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}