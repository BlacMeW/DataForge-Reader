import React, { useState } from 'react'
import { Sparkles, Tag, Heart, TrendingUp, Loader, AlertCircle, X, CheckSquare, Square, List, Cloud } from 'lucide-react'
import ReactWordcloud from 'react-wordcloud'
import type { ParsedParagraph } from '../App'
import {
  analyzeSingleText,
  analyzeBatchTexts,
  getEntityColor,
  getSentimentColor,
  getSentimentIcon,
  highlightEntities,
  type AnalysisResult,
  type BatchAnalysisResult
} from '../services/dataMiningApi'

interface DataMiningProps {
  paragraphs: ParsedParagraph[]
  onClose: () => void
}

const DataMining: React.FC<DataMiningProps> = ({ paragraphs, onClose }) => {
  const [selectedParagraph, setSelectedParagraph] = useState<string>('')
  const [selectedParagraphs, setSelectedParagraphs] = useState<string[]>([])
  const [customText, setCustomText] = useState<string>('')
  const [useCustomText, setUseCustomText] = useState<boolean>(false)
  const [useBatchMode, setUseBatchMode] = useState<boolean>(false)
  const [showHighlighting, setShowHighlighting] = useState<boolean>(true)
  const [keywordViewMode, setKeywordViewMode] = useState<'list' | 'cloud'>('cloud')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'entities' | 'keywords' | 'sentiment' | 'stats'>('entities')

  const toggleParagraphSelection = (id: string) => {
    setSelectedParagraphs(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const selectAllParagraphs = () => {
    setSelectedParagraphs(paragraphs.map(p => p.id))
  }

  const deselectAllParagraphs = () => {
    setSelectedParagraphs([])
  }

  // Helper function to merge multiple batch results into one
  const mergeChunkResults = (chunks: BatchAnalysisResult[]): BatchAnalysisResult => {
    if (chunks.length === 0) {
      throw new Error('No chunks to merge')
    }
    
    if (chunks.length === 1) {
      return chunks[0]
    }
    
    // Merge all chunk results
    const merged: BatchAnalysisResult = {
      total_texts: 0,
      individual_results: [],
      aggregated_entities: [],
      aggregated_keywords: [],
      aggregated_sentiment: {
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        average_score: 0
      },
      aggregated_statistics: {
        total_words: 0,
        total_chars: 0,
        total_sentences: 0,
        avg_word_length: 0,
        avg_sentence_length: 0,
        total_unique_words: 0,
        avg_lexical_diversity: 0
      }
    }
    
    // Merge individual results
    chunks.forEach(chunk => {
      merged.total_texts += chunk.total_texts
      if (chunk.individual_results) {
        merged.individual_results.push(...chunk.individual_results)
      }
    })
    
    // Merge entities (count occurrences)
    const entityMap = new Map<string, { text: string; label: string; start: number; end: number; confidence: number }>()
    chunks.forEach(chunk => {
      chunk.aggregated_entities?.forEach(entity => {
        const key = `${entity.text}_${entity.label}`
        if (entityMap.has(key)) {
          const existing = entityMap.get(key)!
          existing.confidence = (existing.confidence + entity.confidence) / 2
        } else {
          entityMap.set(key, { ...entity, start: 0, end: 0 })
        }
      })
    })
    merged.aggregated_entities = Array.from(entityMap.values())
    
    // Merge keywords (sum scores)
    const keywordMap = new Map<string, { keyword: string; score: number; type: string }>()
    chunks.forEach(chunk => {
      chunk.aggregated_keywords?.forEach(keyword => {
        if (keywordMap.has(keyword.keyword)) {
          const existing = keywordMap.get(keyword.keyword)!
          existing.score += keyword.score
        } else {
          keywordMap.set(keyword.keyword, { ...keyword })
        }
      })
    })
    merged.aggregated_keywords = Array.from(keywordMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 30) // Top 30 keywords
    
    // Merge sentiment
    let totalScore = 0
    chunks.forEach(chunk => {
      if (chunk.aggregated_sentiment) {
        merged.aggregated_sentiment!.positive_count += chunk.aggregated_sentiment.positive_count
        merged.aggregated_sentiment!.negative_count += chunk.aggregated_sentiment.negative_count
        merged.aggregated_sentiment!.neutral_count += chunk.aggregated_sentiment.neutral_count
        totalScore += chunk.aggregated_sentiment.average_score * chunk.total_texts
      }
    })
    merged.aggregated_sentiment!.average_score = totalScore / merged.total_texts
    
    // Merge statistics
    chunks.forEach(chunk => {
      if (chunk.aggregated_statistics) {
        merged.aggregated_statistics!.total_words += chunk.aggregated_statistics.total_words
        merged.aggregated_statistics!.total_chars += chunk.aggregated_statistics.total_chars
        merged.aggregated_statistics!.total_sentences += chunk.aggregated_statistics.total_sentences
      }
    })
    
    // Calculate averages for statistics
    if (merged.aggregated_statistics) {
      merged.aggregated_statistics.avg_word_length = 
        merged.aggregated_statistics.total_chars / merged.aggregated_statistics.total_words
      merged.aggregated_statistics.avg_sentence_length = 
        merged.aggregated_statistics.total_words / merged.aggregated_statistics.total_sentences
    }
    
    return merged
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setAnalysisResult(null)
    setBatchResult(null)
    
    try {
      if (useBatchMode) {
        // Batch analysis mode
        if (selectedParagraphs.length === 0) {
          setError('Please select at least one paragraph for batch analysis')
          return
        }

        const textsToAnalyze = paragraphs
          .filter(p => selectedParagraphs.includes(p.id))
          .map(p => p.text)

        // Check if batch is too large and needs chunking
        const MAX_BATCH_SIZE = 100 // Backend limit
        
        if (textsToAnalyze.length > MAX_BATCH_SIZE) {
          // Split into chunks and process sequentially
          const chunks: string[][] = []
          for (let i = 0; i < textsToAnalyze.length; i += MAX_BATCH_SIZE) {
            chunks.push(textsToAnalyze.slice(i, i + MAX_BATCH_SIZE))
          }
          
          setError(`Processing ${textsToAnalyze.length} paragraphs in ${chunks.length} batches...`)
          
          const allResults: BatchAnalysisResult[] = []
          
          for (let i = 0; i < chunks.length; i++) {
            setError(`Processing batch ${i + 1} of ${chunks.length}...`)
            
            const chunkResult = await analyzeBatchTexts(chunks[i], {
              include_entities: true,
              include_keywords: true,
              include_sentiment: true,
              include_statistics: true,
              include_summary: true,
              top_keywords: 10
            })
            
            allResults.push(chunkResult)
          }
          
          // Merge all results
          const mergedResult = mergeChunkResults(allResults)
          setBatchResult(mergedResult)
          setError('') // Clear the progress message
          
        } else {
          // Normal batch processing (under 100 items)
          const result = await analyzeBatchTexts(textsToAnalyze, {
            include_entities: true,
            include_keywords: true,
            include_sentiment: true,
            include_statistics: true,
            include_summary: true,
            top_keywords: 10
          })

          setBatchResult(result)
        }
      } else {
        // Single text analysis mode
        const textToAnalyze = useCustomText ? customText : 
          paragraphs.find(p => p.id === selectedParagraph)?.text || ''

        if (!textToAnalyze.trim()) {
          setError('Please enter or select text to analyze')
          return
        }

        const result = await analyzeSingleText(textToAnalyze, {
          include_entities: true,
          include_keywords: true,
          include_sentiment: true,
          include_statistics: true,
          include_summary: true,
          top_keywords: 10
        })

        setAnalysisResult(result)
      }
    } catch (err) {
      // Robust error message extraction
      let errorMessage = 'Analysis failed'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message)
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
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
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={28} color="#8b5cf6" />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>NLP Data Mining</h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                Analyze text with Named Entity Recognition, Keywords, and Sentiment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {/* Input Section */}
          <div style={{
            marginBottom: '24px',
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px'
          }}>
            {/* Mode Selection */}
            <div style={{ 
              marginBottom: '20px', 
              paddingBottom: '16px', 
              borderBottom: '2px solid #e5e7eb',
              display: 'flex',
              gap: '20px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={!useBatchMode}
                  onChange={() => {
                    setUseBatchMode(false)
                    setSelectedParagraphs([])
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', color: !useBatchMode ? '#8b5cf6' : '#6b7280' }}>
                  Single Analysis
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={useBatchMode}
                  onChange={() => {
                    setUseBatchMode(true)
                    setUseCustomText(false)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', color: useBatchMode ? '#8b5cf6' : '#6b7280' }}>
                  Batch Analysis (Multiple Paragraphs)
                </span>
              </label>
            </div>

            {/* Single Analysis Mode */}
            {!useBatchMode && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={!useCustomText}
                      onChange={() => setUseCustomText(false)}
                    />
                    <span>Select from paragraphs</span>
                  </label>
                  {!useCustomText && (
                    <select
                      value={selectedParagraph}
                      onChange={(e) => setSelectedParagraph(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">-- Select a paragraph --</option>
                      {paragraphs.map((p, idx) => (
                        <option key={p.id} value={p.id}>
                          Paragraph {idx + 1} (Page {p.page}) - {p.text.substring(0, 60)}...
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={useCustomText}
                      onChange={() => setUseCustomText(true)}
                    />
                    <span>Enter custom text</span>
                  </label>
                  {useCustomText && (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Enter text to analyze..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  )}
                </div>
              </>
            )}

            {/* Batch Analysis Mode */}
            {useBatchMode && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    Select Paragraphs ({selectedParagraphs.length} selected)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={selectAllParagraphs}
                      style={{
                        background: '#e0e7ff',
                        border: '1px solid #8b5cf6',
                        color: '#8b5cf6',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllParagraphs}
                      style={{
                        background: 'white',
                        border: '1px solid #d1d5db',
                        color: '#6b7280',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  padding: '8px'
                }}>
                  {paragraphs.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => toggleParagraphSelection(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedParagraphs.includes(p.id) ? '#ede9fe' : 'transparent',
                        border: selectedParagraphs.includes(p.id) ? '1px solid #8b5cf6' : '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ paddingTop: '2px' }}>
                        {selectedParagraphs.includes(p.id) ? (
                          <CheckSquare size={18} color="#8b5cf6" />
                        ) : (
                          <Square size={18} color="#9ca3af" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          marginBottom: '4px',
                          fontWeight: '600'
                        }}>
                          Paragraph {idx + 1} (Page {p.page})
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#374151',
                          lineHeight: '1.4'
                        }}>
                          {p.text.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader size={20} className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Text
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* Analyzed Text Display with Entity Highlighting */}
          {analysisResult && !batchResult && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>
                  Analyzed Text
                </h3>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <input
                    type="checkbox"
                    checked={showHighlighting}
                    onChange={(e) => setShowHighlighting(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Tag size={16} />
                  <span>Highlight Entities</span>
                </label>
              </div>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '300px',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#1f2937'
              }}>
                {showHighlighting && analysisResult.entities && analysisResult.entities.length > 0 ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: highlightEntities(
                        useCustomText ? customText : paragraphs.find(p => p.id === selectedParagraph)?.text || '',
                        analysisResult.entities
                      )
                    }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {useCustomText ? customText : paragraphs.find(p => p.id === selectedParagraph)?.text || ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Single Analysis Results */}
          {analysisResult && !batchResult && (
            <div>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '2px solid #e5e7eb',
                marginBottom: '20px'
              }}>
                {(['entities', 'keywords', 'sentiment', 'stats'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #8b5cf6' : '2px solid transparent',
                      color: activeTab === tab ? '#8b5cf6' : '#6b7280',
                      fontWeight: activeTab === tab ? '600' : '400',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab === 'entities' && <Tag size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
                    {tab === 'keywords' && <TrendingUp size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
                    {tab === 'sentiment' && <Heart size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Entities Tab */}
              {activeTab === 'entities' && analysisResult.entities && (
                <div>
                  <h3 style={{ marginTop: 0 }}>Named Entities ({analysisResult.entities.length})</h3>
                  {analysisResult.entities.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No entities found in this text.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysisResult.entities.map((entity, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            background: `${getEntityColor(entity.label)}20`,
                            border: `1px solid ${getEntityColor(entity.label)}40`
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '600',
                              color: getEntityColor(entity.label)
                            }}
                          >
                            {entity.text}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              background: getEntityColor(entity.label),
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontWeight: '600'
                            }}
                          >
                            {entity.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Keywords Tab */}
              {activeTab === 'keywords' && analysisResult.keywords && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ margin: 0 }}>Top Keywords ({analysisResult.keywords.length})</h3>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      background: '#f3f4f6',
                      padding: '4px',
                      borderRadius: '8px'
                    }}>
                      <button
                        onClick={() => setKeywordViewMode('list')}
                        style={{
                          background: keywordViewMode === 'list' ? '#8b5cf6' : 'transparent',
                          color: keywordViewMode === 'list' ? 'white' : '#6b7280',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <List size={16} />
                        List
                      </button>
                      <button
                        onClick={() => setKeywordViewMode('cloud')}
                        style={{
                          background: keywordViewMode === 'cloud' ? '#8b5cf6' : 'transparent',
                          color: keywordViewMode === 'cloud' ? 'white' : '#6b7280',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Cloud size={16} />
                        Cloud
                      </button>
                    </div>
                  </div>
                  
                  {analysisResult.keywords.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No keywords extracted.</p>
                  ) : keywordViewMode === 'cloud' ? (
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      minHeight: '400px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ReactWordcloud
                        words={analysisResult.keywords.map(kw => ({
                          text: kw.keyword,
                          value: Math.max(kw.score * 100, 10) // Scale up and ensure minimum size
                        }))}
                        options={{
                          rotations: 2,
                          rotationAngles: [0, 90],
                          fontSizes: [16, 72],
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: '600',
                          padding: 4,
                          scale: 'sqrt',
                          spiral: 'archimedean',
                          transitionDuration: 1000,
                          colors: [
                            '#8b5cf6', '#6366f1', '#3b82f6', 
                            '#0ea5e9', '#06b6d4', '#14b8a6',
                            '#10b981', '#84cc16', '#eab308',
                            '#f97316', '#ef4444', '#ec4899'
                          ],
                          enableTooltip: true,
                          deterministic: true,
                          enableOptimizations: true
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      {analysisResult.keywords.map((keyword, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            marginBottom: '8px',
                            background: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#8b5cf6',
                                color: 'white',
                                borderRadius: '50%',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span style={{ fontWeight: '500' }}>{keyword.keyword}</span>
                            <span
                              style={{
                                fontSize: '11px',
                                background: '#e0e7ff',
                                color: '#6366f1',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}
                            >
                              {keyword.type}
                            </span>
                          </div>
                          <div style={{
                            width: `${Math.min(keyword.score * 50, 100)}%`,
                            height: '6px',
                            background: '#8b5cf6',
                            borderRadius: '3px',
                            maxWidth: '200px'
                          }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment Tab */}
              {activeTab === 'sentiment' && analysisResult.sentiment && (
                <div>
                  <h3 style={{ marginTop: 0 }}>Sentiment Analysis</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '32px',
                      background: `${getSentimentColor(analysisResult.sentiment.sentiment)}10`,
                      borderRadius: '12px',
                      border: `2px solid ${getSentimentColor(analysisResult.sentiment.sentiment)}30`
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '48px',
                          marginBottom: '12px'
                        }}>
                          {getSentimentIcon(analysisResult.sentiment.sentiment)}
                        </div>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: '700',
                          color: getSentimentColor(analysisResult.sentiment.sentiment),
                          textTransform: 'capitalize',
                          marginBottom: '8px'
                        }}>
                          {analysisResult.sentiment.sentiment}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Score: {analysisResult.sentiment.score.toFixed(3)} | 
                          Confidence: {(analysisResult.sentiment.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px'
                    }}>
                      <div style={{
                        padding: '16px',
                        background: '#dcfce7',
                        borderRadius: '8px',
                        border: '1px solid #86efac'
                      }}>
                        <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                          Positive Indicators
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>
                          {analysisResult.sentiment.positive_indicators}
                        </div>
                      </div>
                      <div style={{
                        padding: '16px',
                        background: '#fee2e2',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5'
                      }}>
                        <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>
                          Negative Indicators
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                          {analysisResult.sentiment.negative_indicators}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && analysisResult.summary && (
                <div>
                  <h3 style={{ marginTop: 0 }}>Text Statistics</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {[
                      { label: 'Words', value: analysisResult.summary.word_count, icon: '📝' },
                      { label: 'Characters', value: analysisResult.summary.char_count, icon: '🔤' },
                      { label: 'Sentences', value: analysisResult.summary.sentence_count, icon: '📄' },
                      { label: 'Unique Words', value: analysisResult.summary.unique_words, icon: '✨' },
                      { label: 'Avg Word Length', value: analysisResult.summary.avg_word_length.toFixed(1), icon: '📏' },
                      { label: 'Lexical Diversity', value: `${(analysisResult.summary.lexical_diversity * 100).toFixed(1)}%`, icon: '🎯' },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {stat.label}
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {analysisResult.statistics && (
                    <div style={{ marginTop: '24px' }}>
                      <h4>Extracted Data</h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {analysisResult.statistics.numbers.length > 0 && (
                          <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
                            <strong>Numbers found:</strong> {analysisResult.statistics.numbers.join(', ')}
                          </div>
                        )}
                        {analysisResult.statistics.currencies.length > 0 && (
                          <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '6px' }}>
                            <strong>Currencies:</strong> {analysisResult.statistics.currencies.join(', ')}
                          </div>
                        )}
                        {analysisResult.statistics.percentages.length > 0 && (
                          <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px' }}>
                            <strong>Percentages:</strong> {analysisResult.statistics.percentages.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Batch Analysis Results */}
          {batchResult && (
            <div>
              <div style={{
                background: '#ede9fe',
                border: '2px solid #8b5cf6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  margin: '0 0 8px', 
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Sparkles size={20} />
                  Batch Analysis Results
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  Analyzed {batchResult.total_texts} paragraphs with aggregated results
                </p>
              </div>

              {/* Aggregated Entities */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  marginTop: 0,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Tag size={20} color="#8b5cf6" />
                  Aggregated Entities ({batchResult.aggregated_entities?.length || 0})
                </h3>
                {!batchResult.aggregated_entities || batchResult.aggregated_entities.length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No entities found across the analyzed texts.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {batchResult.aggregated_entities.map((entity, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '20px',
                          background: `${getEntityColor(entity.label)}20`,
                          border: `2px solid ${getEntityColor(entity.label)}40`
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '600',
                            color: getEntityColor(entity.label),
                            fontSize: '15px'
                          }}
                        >
                          {entity.text}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            background: getEntityColor(entity.label),
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: '600'
                          }}
                        >
                          {entity.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aggregated Keywords */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <TrendingUp size={20} color="#8b5cf6" />
                    Top Keywords Across All Texts ({batchResult.aggregated_keywords?.length || 0})
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    background: '#f3f4f6',
                    padding: '4px',
                    borderRadius: '8px'
                  }}>
                    <button
                      onClick={() => setKeywordViewMode('list')}
                      style={{
                        background: keywordViewMode === 'list' ? '#8b5cf6' : 'transparent',
                        color: keywordViewMode === 'list' ? 'white' : '#6b7280',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <List size={16} />
                      List
                    </button>
                    <button
                      onClick={() => setKeywordViewMode('cloud')}
                      style={{
                        background: keywordViewMode === 'cloud' ? '#8b5cf6' : 'transparent',
                        color: keywordViewMode === 'cloud' ? 'white' : '#6b7280',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Cloud size={16} />
                      Cloud
                    </button>
                  </div>
                </div>
                
                {!batchResult.aggregated_keywords || batchResult.aggregated_keywords.length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No keywords extracted.</p>
                ) : keywordViewMode === 'cloud' ? (
                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ReactWordcloud
                      words={batchResult.aggregated_keywords.map(kw => ({
                        text: kw.keyword,
                        value: Math.max(kw.score * 100, 10)
                      }))}
                      options={{
                        rotations: 2,
                        rotationAngles: [0, 90],
                        fontSizes: [16, 72],
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '600',
                        padding: 4,
                        scale: 'sqrt',
                        spiral: 'archimedean',
                        transitionDuration: 1000,
                        colors: [
                          '#8b5cf6', '#6366f1', '#3b82f6', 
                          '#0ea5e9', '#06b6d4', '#14b8a6',
                          '#10b981', '#84cc16', '#eab308',
                          '#f97316', '#ef4444', '#ec4899'
                        ],
                        enableTooltip: true,
                        deterministic: true,
                        enableOptimizations: true
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {batchResult.aggregated_keywords.map((keyword, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#8b5cf6',
                              color: 'white',
                              borderRadius: '50%',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '14px', flex: 1 }}>
                            {keyword.keyword}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              background: '#e0e7ff',
                              color: '#6366f1',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}
                          >
                            {keyword.type}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(keyword.score * 50, 100)}%`,
                            height: '100%',
                            background: '#8b5cf6',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <div style={{ 
                          marginTop: '4px',
                          fontSize: '11px',
                          color: '#6b7280',
                          textAlign: 'right'
                        }}>
                          Score: {keyword.score.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sentiment Distribution */}
              {batchResult.aggregated_sentiment && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ 
                    marginTop: 0,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Heart size={20} color="#8b5cf6" />
                    Sentiment Distribution
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '20px',
                      background: '#dcfce7',
                      borderRadius: '12px',
                      border: '2px solid #86efac',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>😊</div>
                      <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px', fontWeight: '600' }}>
                        Positive
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#15803d' }}>
                        {batchResult.aggregated_sentiment.positive_count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                        ({((batchResult.aggregated_sentiment.positive_count / batchResult.total_texts) * 100).toFixed(0)}%)
                      </div>
                    </div>
                    <div style={{
                      padding: '20px',
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      border: '2px solid #d1d5db',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>😐</div>
                      <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px', fontWeight: '600' }}>
                        Neutral
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#6b7280' }}>
                        {batchResult.aggregated_sentiment.neutral_count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                        ({((batchResult.aggregated_sentiment.neutral_count / batchResult.total_texts) * 100).toFixed(0)}%)
                      </div>
                    </div>
                    <div style={{
                      padding: '20px',
                      background: '#fee2e2',
                      borderRadius: '12px',
                      border: '2px solid #fca5a5',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>😞</div>
                      <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px', fontWeight: '600' }}>
                        Negative
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
                        {batchResult.aggregated_sentiment.negative_count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                        ({((batchResult.aggregated_sentiment.negative_count / batchResult.total_texts) * 100).toFixed(0)}%)
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Average Sentiment Score
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}>
                      {batchResult.aggregated_sentiment.average_score.toFixed(3)}
                    </div>
                  </div>
                </div>
              )}

              {/* Average Statistics */}
              {batchResult.aggregated_statistics && (
                <div>
                  <h3 style={{ 
                    marginTop: 0,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📊 Aggregated Text Statistics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                  }}>
                    {[
                      { label: 'Total Words', value: batchResult.aggregated_statistics.total_words.toLocaleString(), icon: '📝' },
                      { label: 'Total Characters', value: batchResult.aggregated_statistics.total_chars.toLocaleString(), icon: '🔤' },
                      { label: 'Total Sentences', value: batchResult.aggregated_statistics.total_sentences.toLocaleString(), icon: '📄' },
                      { label: 'Unique Words', value: batchResult.aggregated_statistics.total_unique_words.toLocaleString(), icon: '✨' },
                      { label: 'Avg Word Length', value: batchResult.aggregated_statistics.avg_word_length.toFixed(2), icon: '📏' },
                      { label: 'Avg Lexical Diversity', value: `${(batchResult.aggregated_statistics.avg_lexical_diversity * 100).toFixed(1)}%`, icon: '🎯' },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          {stat.label}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700' }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .entity {
          cursor: help;
          transition: all 0.2s ease;
          display: inline;
          position: relative;
        }

        .entity:hover {
          filter: brightness(0.9);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}

export default DataMining
