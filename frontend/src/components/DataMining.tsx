import React, { useState } from 'react'
import axios from 'axios'
import { Sparkles, Tag, Heart, TrendingUp, Loader, AlertCircle, X } from 'lucide-react'
import type { ParsedParagraph } from '../App'

interface DataMiningProps {
  paragraphs: ParsedParagraph[]
  onClose: () => void
}

interface Entity {
  text: string
  label: string
  start: number
  end: number
  confidence: number
}

interface Keyword {
  keyword: string
  score: number
  type: string
}

interface Sentiment {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  confidence: number
  positive_indicators: number
  negative_indicators: number
}

interface Statistics {
  numbers: number[]
  percentages: string[]
  currencies: string[]
  measurements: string[]
}

interface Summary {
  word_count: number
  char_count: number
  sentence_count: number
  avg_word_length: number
  avg_sentence_length: number
  unique_words: number
  lexical_diversity: number
}

interface AnalysisResult {
  text_length: number
  entities?: Entity[]
  keywords?: Keyword[]
  sentiment?: Sentiment
  statistics?: Statistics
  summary?: Summary
  language: string
}

const API_BASE_URL = 'http://localhost:8000/api'

const DataMining: React.FC<DataMiningProps> = ({ paragraphs, onClose }) => {
  const [selectedParagraph, setSelectedParagraph] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [useCustomText, setUseCustomText] = useState<boolean>(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'entities' | 'keywords' | 'sentiment' | 'stats'>('entities')

  const handleAnalyze = async () => {
    const textToAnalyze = useCustomText ? customText : 
      paragraphs.find(p => p.id === selectedParagraph)?.text || ''

    if (!textToAnalyze.trim()) {
      setError('Please enter or select text to analyze')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post(`${API_BASE_URL}/mine/analyze`, {
        text: textToAnalyze,
        include_entities: true,
        include_keywords: true,
        include_sentiment: true,
        include_statistics: true,
        include_summary: true,
        top_keywords: 10
      })
      
      setAnalysisResult(response.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Analysis failed')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const getEntityColor = (label: string): string => {
    const colors: Record<string, string> = {
      'PERSON': '#3b82f6',
      'ORG': '#8b5cf6',
      'GPE': '#10b981',
      'DATE': '#f59e0b',
      'MONEY': '#059669',
      'PRODUCT': '#ec4899',
      'TIME': '#06b6d4',
      'PERCENT': '#ef4444',
      'CARDINAL': '#6366f1',
    }
    return colors[label] || '#6b7280'
  }

  const getSentimentColor = (sentiment: string): string => {
    if (sentiment === 'positive') return '#10b981'
    if (sentiment === 'negative') return '#ef4444'
    return '#f59e0b'
  }

  const getSentimentIcon = (sentiment: string): string => {
    if (sentiment === 'positive') return '✓'
    if (sentiment === 'negative') return '✗'
    return '~'
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

          {/* Results */}
          {analysisResult && (
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
                  <h3 style={{ marginTop: 0 }}>Top Keywords ({analysisResult.keywords.length})</h3>
                  {analysisResult.keywords.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No keywords extracted.</p>
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
      `}</style>
    </div>
  )
}

export default DataMining
