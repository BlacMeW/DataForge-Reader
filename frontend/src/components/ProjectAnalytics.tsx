import React, { useState, useEffect, useMemo } from 'react'
import { TrendingUp, BarChart3, PieChart, Users, FileText, Calendar, X, Loader, AlertCircle, Award, Target, Zap, Cloud } from 'lucide-react'
import ReactWordcloud from 'react-wordcloud'
import type { Project } from './ProjectManager'
import { 
  analyzeBatchTexts, 
  getEntityColor, 
  getSentimentColor,
  type BatchAnalysisResult 
} from '../services/dataMiningApi'

interface ProjectAnalyticsProps {
  project: Project
  onClose: () => void
}

interface FileAnalysis {
  fileId: string
  filename: string
  analysis: BatchAnalysisResult | null
  error: string | null
  loading: boolean
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ project, onClose }) => {
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'keywords' | 'wordclouds' | 'sentiment' | 'trends'>('overview')

  // Initialize file analyses
  useEffect(() => {
    setFileAnalyses(project.files.map(f => ({
      fileId: f.file_id,
      filename: f.filename,
      analysis: null,
      error: null,
      loading: false
    })))
  }, [project])

  // Analyze all files in the project
  useEffect(() => {
    const analyzeProject = async () => {
      setLoading(true)
      setError('')

      try {
        const projectFiles = project.files
        
        // Analyze each file
        for (const file of projectFiles) {
          setFileAnalyses(prev => prev.map(fa => 
            fa.fileId === file.file_id ? { ...fa, loading: true } : fa
          ))

          try {
            // Fetch paragraphs for this file
            const response = await fetch(`http://localhost:8000/api/parse/${file.file_id}`)
            const data = await response.json()
            
            if (data.paragraphs && data.paragraphs.length > 0) {
              const texts = data.paragraphs.map((p: { text: string }) => p.text)
              
              // Analyze all paragraphs
              const analysis = await analyzeBatchTexts(texts, {
                include_entities: true,
                include_keywords: true,
                include_sentiment: true,
                include_statistics: true,
                include_summary: true,
                top_keywords: 20
              })

              setFileAnalyses(prev => prev.map(fa =>
                fa.fileId === file.file_id 
                  ? { ...fa, analysis, loading: false, error: null }
                  : fa
              ))
            } else {
              setFileAnalyses(prev => prev.map(fa =>
                fa.fileId === file.file_id 
                  ? { ...fa, loading: false, error: 'No paragraphs found' }
                  : fa
              ))
            }
          } catch (err) {
            setFileAnalyses(prev => prev.map(fa =>
              fa.fileId === file.file_id 
                ? { ...fa, loading: false, error: err instanceof Error ? err.message : 'Analysis failed' }
                : fa
            ))
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Project analysis failed')
      } finally {
        setLoading(false)
      }
    }

    if (fileAnalyses.length > 0 && fileAnalyses.every(fa => !fa.analysis && !fa.loading)) {
      analyzeProject()
    }
  }, [fileAnalyses, project])

  // Aggregate data across all files
  const aggregatedData = useMemo(() => {
    const analyses = fileAnalyses.filter(fa => fa.analysis).map(fa => fa.analysis!)
    
    if (analyses.length === 0) {
      return null
    }

    // Aggregate entities
    const entityMap = new Map<string, { text: string; label: string; count: number }>()
    analyses.forEach(analysis => {
      analysis.aggregated_entities?.forEach(entity => {
        const key = `${entity.text}_${entity.label}`
        const existing = entityMap.get(key)
        if (existing) {
          existing.count++
        } else {
          entityMap.set(key, { text: entity.text, label: entity.label, count: 1 })
        }
      })
    })
    const topEntities = Array.from(entityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)

    // Aggregate keywords
    const keywordMap = new Map<string, { keyword: string; score: number; count: number }>()
    analyses.forEach(analysis => {
      analysis.aggregated_keywords?.forEach(kw => {
        const existing = keywordMap.get(kw.keyword)
        if (existing) {
          existing.score += kw.score
          existing.count++
        } else {
          keywordMap.set(kw.keyword, { keyword: kw.keyword, score: kw.score, count: 1 })
        }
      })
    })
    const topKeywords = Array.from(keywordMap.values())
      .map(kw => ({ ...kw, avgScore: kw.score / kw.count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 30)

    // Aggregate sentiment
    let totalPositive = 0
    let totalNegative = 0
    let totalNeutral = 0
    let totalScore = 0
    analyses.forEach(analysis => {
      if (analysis.aggregated_sentiment) {
        totalPositive += analysis.aggregated_sentiment.positive_count
        totalNegative += analysis.aggregated_sentiment.negative_count
        totalNeutral += analysis.aggregated_sentiment.neutral_count
        totalScore += analysis.aggregated_sentiment.average_score
      }
    })
    const totalTexts = totalPositive + totalNegative + totalNeutral
    const avgScore = analyses.length > 0 ? totalScore / analyses.length : 0

    // Aggregate statistics
    let totalWords = 0
    let totalChars = 0
    let totalSentences = 0
    analyses.forEach(analysis => {
      if (analysis.aggregated_statistics) {
        totalWords += analysis.aggregated_statistics.total_words
        totalChars += analysis.aggregated_statistics.total_chars
        totalSentences += analysis.aggregated_statistics.total_sentences
      }
    })

    return {
      entities: topEntities,
      keywords: topKeywords,
      sentiment: {
        positive: totalPositive,
        negative: totalNegative,
        neutral: totalNeutral,
        total: totalTexts,
        avgScore
      },
      statistics: {
        totalWords,
        totalChars,
        totalSentences,
        filesAnalyzed: analyses.length
      }
    }
  }, [fileAnalyses])

  if (loading && fileAnalyses.every(fa => !fa.analysis)) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <Loader size={48} className="spinner" style={{ marginBottom: '20px', color: '#8b5cf6' }} />
          <h2 style={{ margin: '0 0 12px', fontSize: '24px' }}>Analyzing Project</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Processing {fileAnalyses.length} file{fileAnalyses.length !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '1400px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <BarChart3 size={32} color="#8b5cf6" />
              Project Analytics
            </h2>
            <p style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '16px'
            }}>
              {project.name} • {fileAnalyses.length} file{fileAnalyses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 24px',
          borderBottom: '2px solid #e5e7eb',
          overflowX: 'auto'
        }}>
          {([
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'entities', label: 'Entities', icon: Users },
            { id: 'keywords', label: 'Keywords', icon: TrendingUp },
            { id: 'wordclouds', label: 'Word Clouds', icon: Cloud },
            { id: 'sentiment', label: 'Sentiment', icon: PieChart },
            { id: 'trends', label: 'Trends', icon: Calendar }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#8b5cf6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={24} color="#dc2626" />
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {!aggregatedData ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <BarChart3 size={64} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>No Data Available</h3>
              <p style={{ margin: 0 }}>Upload and parse documents to see project analytics</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  {/* Key Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <FileText size={24} />
                        <span style={{ fontSize: '14px', opacity: 0.9 }}>Files Analyzed</span>
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: '700' }}>
                        {aggregatedData.statistics.filesAnalyzed}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Zap size={24} />
                        <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Words</span>
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: '700' }}>
                        {aggregatedData.statistics.totalWords.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Users size={24} />
                        <span style={{ fontSize: '14px', opacity: 0.9 }}>Unique Entities</span>
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: '700' }}>
                        {aggregatedData.entities.length}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Award size={24} />
                        <span style={{ fontSize: '14px', opacity: 0.9 }}>Avg Sentiment</span>
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: '700' }}>
                        {aggregatedData.sentiment.avgScore >= 0 ? '+' : ''}{aggregatedData.sentiment.avgScore.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>Project Summary</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Characters</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                        {aggregatedData.statistics.totalChars.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Sentences</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                        {aggregatedData.statistics.totalSentences.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Texts Analyzed</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                        {aggregatedData.sentiment.total.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Top Keywords</div>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                        {aggregatedData.keywords.length}
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Overview */}
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>Sentiment Distribution</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      background: '#f0fdf4',
                      border: '2px solid #86efac',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>😊</div>
                      <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>Positive</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>
                        {aggregatedData.sentiment.positive}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {aggregatedData.sentiment.total > 0 
                          ? ((aggregatedData.sentiment.positive / aggregatedData.sentiment.total) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>

                    <div style={{
                      background: '#f9fafb',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>😐</div>
                      <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '4px' }}>Neutral</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7280' }}>
                        {aggregatedData.sentiment.neutral}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {aggregatedData.sentiment.total > 0 
                          ? ((aggregatedData.sentiment.neutral / aggregatedData.sentiment.total) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>

                    <div style={{
                      background: '#fef2f2',
                      border: '2px solid #fca5a5',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>😞</div>
                      <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '600', marginBottom: '4px' }}>Negative</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>
                        {aggregatedData.sentiment.negative}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {aggregatedData.sentiment.total > 0 
                          ? ((aggregatedData.sentiment.negative / aggregatedData.sentiment.total) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Entities Tab */}
              {activeTab === 'entities' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>
                    Top Entities Across Project ({aggregatedData.entities.length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {aggregatedData.entities.map((entity, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          background: `${getEntityColor(entity.label)}10`,
                          border: `2px solid ${getEntityColor(entity.label)}40`,
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            fontWeight: '600',
                            color: getEntityColor(entity.label),
                            fontSize: '16px'
                          }}>
                            {entity.text}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            background: getEntityColor(entity.label),
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: '600'
                          }}>
                            {entity.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Appears in <strong>{entity.count}</strong> document{entity.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Tab */}
              {activeTab === 'keywords' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>
                    Top Keywords Across Project ({aggregatedData.keywords.length})
                  </h3>
                  <div>
                    {aggregatedData.keywords.map((keyword, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          marginBottom: '12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#8b5cf6',
                              color: 'white',
                              borderRadius: '50%',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontWeight: '600', fontSize: '16px' }}>{keyword.keyword}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Appears in <strong>{keyword.count}</strong> file{keyword.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(keyword.avgScore * 50, 100)}%`,
                            height: '100%',
                            background: '#8b5cf6',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                          Average Score: <strong>{keyword.avgScore.toFixed(3)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Tab */}
              {activeTab === 'sentiment' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>Sentiment Analysis</h3>
                  
                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '32px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '72px', marginBottom: '16px' }}>
                      {aggregatedData.sentiment.avgScore > 0.1 ? '😊' : 
                       aggregatedData.sentiment.avgScore < -0.1 ? '😞' : '😐'}
                    </div>
                    <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                      Overall Project Sentiment
                    </div>
                    <div style={{
                      fontSize: '48px',
                      fontWeight: '700',
                      color: getSentimentColor(
                        aggregatedData.sentiment.avgScore > 0.1 ? 'positive' : 
                        aggregatedData.sentiment.avgScore < -0.1 ? 'negative' : 'neutral'
                      )
                    }}>
                      {aggregatedData.sentiment.avgScore >= 0 ? '+' : ''}{aggregatedData.sentiment.avgScore.toFixed(3)}
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1f2937' }}>Breakdown by File</h4>
                  {fileAnalyses.filter(fa => fa.analysis).map((fa, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                        {fa.filename}
                      </div>
                      {fa.analysis?.aggregated_sentiment && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '12px'
                        }}>
                          <div style={{
                            background: '#f0fdf4',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Positive</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                              {fa.analysis.aggregated_sentiment.positive_count}
                            </div>
                          </div>
                          <div style={{
                            background: '#f9fafb',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Neutral</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>
                              {fa.analysis.aggregated_sentiment.neutral_count}
                            </div>
                          </div>
                          <div style={{
                            background: '#fef2f2',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Negative</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                              {fa.analysis.aggregated_sentiment.negative_count}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Word Clouds Tab */}
              {activeTab === 'wordclouds' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>Word Clouds</h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px'
                  }}>
                    {/* Keywords Word Cloud */}
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} />
                        Keywords Cloud
                      </h4>
                      {aggregatedData.keywords.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                          <ReactWordcloud
                            words={aggregatedData.keywords.slice(0, 50).map(kw => ({
                              text: kw.keyword,
                              value: Math.max(kw.avgScore * 1000, 10) // Scale up for better visualization
                            }))}
                            options={{
                              rotations: 2,
                              rotationAngles: [0, 90],
                              fontSizes: [14, 60],
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
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
                          No keywords available
                        </div>
                      )}
                    </div>

                    {/* Entities Word Cloud */}
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px'
                    }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        Entities Cloud
                      </h4>
                      {aggregatedData.entities.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                          <ReactWordcloud
                            words={aggregatedData.entities.slice(0, 50).map(entity => ({
                              text: entity.text,
                              value: Math.max(entity.count * 20, 10) // Scale based on frequency
                            }))}
                            options={{
                              rotations: 2,
                              rotationAngles: [0, 90],
                              fontSizes: [14, 60],
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              fontWeight: '600',
                              padding: 4,
                              scale: 'sqrt',
                              spiral: 'archimedean',
                              transitionDuration: 1000,
                              colors: [
                                '#dc2626', '#ea580c', '#d97706',
                                '#65a30d', '#059669', '#0891b2',
                                '#2563eb', '#7c3aed', '#c026d3',
                                '#db2777', '#be185d', '#991b1b'
                              ],
                              enableTooltip: true,
                              deterministic: true,
                              enableOptimizations: true
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
                          No entities available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>File Comparison</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {fileAnalyses.filter(fa => fa.analysis).map((fa, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '20px',
                          background: '#f9fafb',
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb'
                        }}
                      >
                        <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1f2937' }}>
                          {fa.filename}
                        </h4>
                        {fa.analysis && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px',
                              background: 'white',
                              borderRadius: '6px'
                            }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>Words</span>
                              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {fa.analysis.aggregated_statistics?.total_words.toLocaleString()}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px',
                              background: 'white',
                              borderRadius: '6px'
                            }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>Entities</span>
                              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {fa.analysis.aggregated_entities?.length || 0}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px',
                              background: 'white',
                              borderRadius: '6px'
                            }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>Keywords</span>
                              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {fa.analysis.aggregated_keywords?.length || 0}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px',
                              background: 'white',
                              borderRadius: '6px'
                            }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>Sentiment</span>
                              <span style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: getSentimentColor(
                                  (fa.analysis.aggregated_sentiment?.average_score || 0) > 0.1 ? 'positive' : 
                                  (fa.analysis.aggregated_sentiment?.average_score || 0) < -0.1 ? 'negative' : 'neutral'
                                )
                              }}>
                                {(fa.analysis.aggregated_sentiment?.average_score || 0) >= 0 ? '+' : ''}
                                {(fa.analysis.aggregated_sentiment?.average_score || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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

export default ProjectAnalytics
