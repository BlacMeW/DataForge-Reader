import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { BookOpen, Loader, AlertCircle, Search, Filter, X, BarChart, Sparkles, Tag, Heart } from 'lucide-react'
import type { UploadedFile, ParsedParagraph } from '../App'
import ExportButtons from './ExportButtons'
import DataAnalytics from './DataAnalytics'
import {
  analyzeSingleText,
  getEntityColor,
  getSentimentColor,
  getSentimentIcon,
  highlightEntities,
  type AnalysisResult
} from '../services/dataMiningApi'

interface ParseViewerProps {
  file: UploadedFile
  onClose: () => void
  onParagraphsLoad?: (paragraphs: ParsedParagraph[]) => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const ParseViewer: React.FC<ParseViewerProps> = ({ file, onClose, onParagraphsLoad }) => {
  const [paragraphs, setParagraphs] = useState<ParsedParagraph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [processingInfo, setProcessingInfo] = useState<{
    totalPages: number
    extractionMethod: string
    processingTime: number
  } | null>(null)
  
  // Progress tracking
  const [processingStep, setProcessingStep] = useState<string>('Initializing...')
  const [processingProgress, setProcessingProgress] = useState<number>(0)
  
  // View state
  const [currentView, setCurrentView] = useState<'content' | 'analytics' | 'nlp'>('content')
  
  // NLP Analysis state
  const [nlpAnalysis, setNlpAnalysis] = useState<Map<string, AnalysisResult>>(new Map())
  const [analyzingParagraph, setAnalyzingParagraph] = useState<string | null>(null)
  const [nlpError, setNlpError] = useState<string>('')

  // Filter states
  const [searchText, setSearchText] = useState<string>('')
  const [selectedPage, setSelectedPage] = useState<string>('all')
  const [minWordCount, setMinWordCount] = useState<string>('')
  const [maxWordCount, setMaxWordCount] = useState<string>('')
  const [minCharCount, setMinCharCount] = useState<string>('')
  const [maxCharCount, setMaxCharCount] = useState<string>('')
  const [showFilters, setShowFilters] = useState<boolean>(false)
  
  // Advanced search states
  const [searchMode, setSearchMode] = useState<'text' | 'regex'>('text')
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false)
  const [wholeWords, setWholeWords] = useState<boolean>(false)
  const [regexError, setRegexError] = useState<string>('')

  // Filter section collapse states
  const [collapseSearch, setCollapseSearch] = useState<boolean>(false)
  const [collapsePage, setCollapsePage] = useState<boolean>(false)
  const [collapseWordCount, setCollapseWordCount] = useState<boolean>(false)
  const [collapseCharCount, setCollapseCharCount] = useState<boolean>(false)

  useEffect(() => {
    parseFile()
  }, [file.file_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseFile = async () => {
    setLoading(true)
    setError('')
    setProcessingProgress(0)
    
    try {
      // Step 1: Initialize processing
      setProcessingStep('Initializing document processing...')
      setProcessingProgress(10)
      
      // Step 2: Send parse request
      setProcessingStep('Extracting text from document...')
      setProcessingProgress(30)
      
      const response = await axios.post(`${API_BASE_URL}/parse`, {
        file_id: file.file_id,
        use_ocr: false
      }, {
        timeout: 300000 // 5 minute timeout for large documents
      })

      // Step 3: Processing response
      setProcessingStep('Organizing extracted content...')
      setProcessingProgress(70)
      
      setParagraphs(response.data.paragraphs)
      
      // Notify parent component if callback provided
      if (onParagraphsLoad) {
        onParagraphsLoad(response.data.paragraphs)
      }
      
      setProcessingInfo({
        totalPages: response.data.total_pages,
        extractionMethod: response.data.extraction_method,
        processingTime: response.data.processing_time
      })
      
      // Step 4: Complete
      setProcessingStep('Processing complete!')
      setProcessingProgress(100)
      
      // Small delay to show completion
      setTimeout(() => {
        setLoading(false)
      }, 500)
      
    } catch (err) {
      setLoading(false)
      setProcessingProgress(0)
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to parse file')
      } else {
        setError('Failed to parse file: Unknown error')
      }
    }
  }

  const handleParagraphClick = (paragraphId: string) => {
    setSelectedParagraph(selectedParagraph === paragraphId ? null : paragraphId)
  }

  // Filter paragraphs based on all filter criteria
  const filteredParagraphs = useMemo(() => {
    return paragraphs.filter(paragraph => {
      // Text search filter with advanced options
      if (searchText) {
        let searchMatch = false
        
        try {
          if (searchMode === 'regex') {
            const flags = caseSensitive ? 'g' : 'gi'
            const regex = new RegExp(searchText, flags)
            searchMatch = regex.test(paragraph.text)
            setRegexError('')
          } else {
            // Text search with options
            const textToSearch = caseSensitive ? paragraph.text : paragraph.text.toLowerCase()
            const searchTerm = caseSensitive ? searchText : searchText.toLowerCase()
            
            if (wholeWords) {
              const wordRegex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? 'g' : 'gi')
              searchMatch = wordRegex.test(paragraph.text)
            } else {
              searchMatch = textToSearch.includes(searchTerm)
            }
          }
        } catch {
          setRegexError('Invalid regular expression')
          searchMatch = false
        }
        
        if (!searchMatch) return false
      }
      
      // Page filter
      if (selectedPage !== 'all' && paragraph.page !== parseInt(selectedPage)) {
        return false
      }
      
      // Word count filters
      if (minWordCount && paragraph.word_count < parseInt(minWordCount)) {
        return false
      }
      if (maxWordCount && paragraph.word_count > parseInt(maxWordCount)) {
        return false
      }
      
      // Character count filters
      if (minCharCount && paragraph.char_count < parseInt(minCharCount)) {
        return false
      }
      if (maxCharCount && paragraph.char_count > parseInt(maxCharCount)) {
        return false
      }
      
      return true
    })
  }, [paragraphs, searchText, selectedPage, minWordCount, maxWordCount, minCharCount, maxCharCount, searchMode, caseSensitive, wholeWords])

  // Clear all filters
  const clearFilters = () => {
    setSearchText('')
    setSelectedPage('all')
    setMinWordCount('')
    setMaxWordCount('')
    setMinCharCount('')
    setMaxCharCount('')
    setSearchMode('text')
    setCaseSensitive(false)
    setWholeWords(false)
    setRegexError('')
  }

  // Get active filters count and details
  const getActiveFilters = () => {
    const active: { key: string; label: string; value: string; clear: () => void }[] = []
    
    if (searchText) {
      active.push({
        key: 'search',
        label: searchMode === 'regex' ? 'Regex' : 'Search',
        value: searchText.length > 20 ? `${searchText.substring(0, 20)}...` : searchText,
        clear: () => setSearchText('')
      })
    }
    if (selectedPage !== 'all') {
      active.push({
        key: 'page',
        label: 'Page',
        value: selectedPage,
        clear: () => setSelectedPage('all')
      })
    }
    if (minWordCount) {
      active.push({
        key: 'minWords',
        label: 'Min Words',
        value: minWordCount,
        clear: () => setMinWordCount('')
      })
    }
    if (maxWordCount) {
      active.push({
        key: 'maxWords',
        label: 'Max Words',
        value: maxWordCount,
        clear: () => setMaxWordCount('')
      })
    }
    if (minCharCount) {
      active.push({
        key: 'minChars',
        label: 'Min Chars',
        value: minCharCount,
        clear: () => setMinCharCount('')
      })
    }
    if (maxCharCount) {
      active.push({
        key: 'maxChars',
        label: 'Max Chars',
        value: maxCharCount,
        clear: () => setMaxCharCount('')
      })
    }
    if (caseSensitive) {
      active.push({
        key: 'caseSensitive',
        label: 'Case Sensitive',
        value: 'On',
        clear: () => setCaseSensitive(false)
      })
    }
    if (wholeWords) {
      active.push({
        key: 'wholeWords',
        label: 'Whole Words',
        value: 'On',
        clear: () => setWholeWords(false)
      })
    }
    
    return active
  }

  const activeFilters = getActiveFilters()
  
  // NLP Analysis function
  const analyzeParagraph = async (paragraphId: string) => {
    const paragraph = paragraphs.find(p => p.id === paragraphId)
    if (!paragraph || analyzingParagraph) return
    
    setAnalyzingParagraph(paragraphId)
    setNlpError('')
    
    try {
      const result = await analyzeSingleText(paragraph.text, {
        include_entities: true,
        include_keywords: true,
        include_sentiment: true,
        include_statistics: true,
        include_summary: true,
        top_keywords: 10
      })
      
      setNlpAnalysis(prev => new Map(prev).set(paragraphId, result))
    } catch (err) {
      setNlpError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingParagraph(null)
    }
  }

  // Get unique page numbers for filter dropdown
  const availablePages = useMemo(() => {
    const pages = Array.from(new Set(paragraphs.map(p => p.page))).sort((a, b) => a - b)
    return pages
  }, [paragraphs])

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
          <Loader size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <h3 style={{ marginTop: '20px', color: '#1e40af' }}>Processing Document</h3>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>{file.filename}</p>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              width: `${processingProgress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              transition: 'width 0.3s ease-in-out'
            }} />
          </div>
          
          {/* Progress Text */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <span>{processingStep}</span>
            <span>{processingProgress}%</span>
          </div>
          
          {/* Additional Processing Info */}
          <div style={{ 
            marginTop: '20px',
            padding: '12px',
            background: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'left'
          }}>
            <div><strong>Large documents may take several minutes to process...</strong></div>
            <div>• PDF text extraction and OCR processing takes time</div>
            <div>• Complex layouts require additional analysis</div>
            <div>• Please wait while processing completes</div>
          </div>
          
          {/* Processing Steps Indicator */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {['Init', 'Extract', 'Organize', 'Complete'].map((step, index) => (
              <div key={step} style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: processingProgress > (index * 25) ? '#3b82f6' : '#e5e7eb',
                transition: 'background-color 0.3s ease'
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={48} color="#dc2626" />
          <h3 style={{ marginTop: '20px' }}>Processing Failed</h3>
          <p>{error}</p>
          <div style={{ marginTop: '20px' }}>
            <button onClick={parseFile} style={{ marginRight: '10px' }}>Try Again</button>
            <button onClick={onClose}>Back to Upload</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h2>
          <BookOpen size={32} style={{ display: 'inline', marginRight: '10px' }} />
          {file.filename}
        </h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <span>📄 {processingInfo?.totalPages} pages</span>
          <span>📝 {paragraphs.length} paragraphs</span>
          <span>⚡ {processingInfo?.extractionMethod}</span>
          <span>⏱️ {processingInfo?.processingTime}s</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onClose}>← Back to Upload</button>
        <button onClick={parseFile}>🔄 Reprocess</button>
        
        {paragraphs.length > 0 && (
          <>
            <div style={{ borderLeft: '1px solid #ccc', height: '30px', margin: '0 10px' }}></div>
            
            {/* View Switcher Buttons */}
            <button 
              onClick={() => setCurrentView('content')}
              style={{
                backgroundColor: currentView === 'content' ? '#3b82f6' : '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <BookOpen size={16} />
              Content
            </button>
            
            <button 
              onClick={() => setCurrentView('analytics')}
              style={{
                backgroundColor: currentView === 'analytics' ? '#10b981' : '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <BarChart size={16} />
              Analytics
            </button>
            
            <button 
              onClick={() => setCurrentView('nlp')}
              style={{
                backgroundColor: currentView === 'nlp' ? '#8b5cf6' : '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={16} />
              NLP Analysis
            </button>
            
            {currentView === 'content' && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  backgroundColor: showFilters ? '#3b82f6' : '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Filter size={16} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            )}
            <ExportButtons fileId={file.file_id} disabled={filteredParagraphs.length === 0} />
          </>
        )}
      </div>

      {/* Filter Panel - Improved UI/UX */}
      {paragraphs.length > 0 && showFilters && (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          {/* Filter Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            borderBottom: '2px solid #1e40af',
            padding: '16px 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={20} color="#ffffff" />
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '17px', 
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  Filter & Search
                </h4>
              </div>
              <span style={{ 
                fontSize: '13px', 
                color: '#dbeafe',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
              }}>
                {filteredParagraphs.length} / {paragraphs.length} results
              </span>
              {activeFilters.length > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#fef08a',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {activeFilters.length} active filter{activeFilters.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              disabled={activeFilters.length === 0}
              style={{
                backgroundColor: activeFilters.length > 0 ? '#ef4444' : '#9ca3af',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: activeFilters.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: activeFilters.length > 0 ? 1 : 0.6
              }}
              onMouseOver={(e) => {
                if (activeFilters.length > 0) {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = activeFilters.length > 0 ? '#ef4444' : '#9ca3af'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={16} />
              Clear All
            </button>
          </div>

          {/* Active Filter Tags */}
          {activeFilters.length > 0 && (
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderBottom: '1px solid #bfdbfe',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginRight: '4px' }}>
                Active Filters:
              </span>
              {activeFilters.map(filter => (
                <div
                  key={filter.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#1e40af',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <span style={{ color: '#64748b' }}>{filter.label}:</span>
                  <span style={{ fontWeight: '600' }}>{filter.value}</span>
                  <button
                    onClick={filter.clear}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#ef4444',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title={`Remove ${filter.label} filter`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Filter Content */}
          <div style={{ padding: '24px' }}>
            
            {/* Text Search Section */}
            <div style={{ 
              marginBottom: '20px',
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s'
            }}>
              <div 
                onClick={() => setCollapseSearch(!collapseSearch)}
                style={{
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={18} color="#3b82f6" />
                  <span style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>
                    Text Search
                  </span>
                  {searchText && (
                    <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '18px', 
                  color: '#64748b',
                  transition: 'transform 0.3s',
                  transform: collapseSearch ? 'rotate(-90deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </span>
              </div>
              
              {!collapseSearch && (
                <div style={{ padding: '18px' }}>
                  {/* Search Mode Toggle */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <button
                      onClick={() => setSearchMode('text')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        border: searchMode === 'text' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: searchMode === 'text' ? '#3b82f6' : 'white',
                        color: searchMode === 'text' ? 'white' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        if (searchMode !== 'text') {
                          e.currentTarget.style.borderColor = '#3b82f6'
                          e.currentTarget.style.background = '#eff6ff'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (searchMode !== 'text') {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.background = 'white'
                        }
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📝</span>
                      Text Search
                    </button>
                    <button
                      onClick={() => setSearchMode('regex')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        border: searchMode === 'regex' ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: searchMode === 'regex' ? '#8b5cf6' : 'white',
                        color: searchMode === 'regex' ? 'white' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        if (searchMode !== 'regex') {
                          e.currentTarget.style.borderColor = '#8b5cf6'
                          e.currentTarget.style.background = '#f5f3ff'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (searchMode !== 'regex') {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.background = 'white'
                        }
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>🔍</span>
                      Regex Search
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder={searchMode === 'regex' ? 'e.g. \\d{3}-\\d{4} (phone pattern)' : 'Type to search in paragraphs...'}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 16px',
                        border: `2px solid ${regexError ? '#ef4444' : searchText ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        marginBottom: regexError ? '10px' : '14px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        backgroundColor: 'white',
                        boxShadow: searchText ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                      }}
                      onFocus={(e) => {
                        if (!regexError) e.target.style.borderColor = '#3b82f6'
                      }}
                      onBlur={(e) => {
                        if (!regexError && !searchText) e.target.style.borderColor = '#e2e8f0'
                      }}
                    />
                    {searchText && (
                      <button
                        onClick={() => setSearchText('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                        title="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Regex Error */}
                  {regexError && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#dc2626', 
                      marginBottom: '12px',
                      background: '#fef2f2',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} />
                      <span><strong>Error:</strong> {regexError}</span>
                    </div>
                  )}
                  
                  {/* Search Options */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontWeight: '500',
                      color: '#475569',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: caseSensitive ? '#eff6ff' : 'transparent',
                      border: caseSensitive ? '1px solid #93c5fd' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <span>Aa</span>
                      <span style={{ marginLeft: '4px' }}>Case sensitive</span>
                    </label>
                    {searchMode === 'text' && (
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#475569',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: wholeWords ? '#eff6ff' : 'transparent',
                        border: wholeWords ? '1px solid #93c5fd' : '1px solid transparent',
                        transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={wholeWords}
                          onChange={(e) => setWholeWords(e.target.checked)}
                          style={{ 
                            marginRight: '8px',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <span>📦</span>
                        <span style={{ marginLeft: '4px' }}>Match whole words only</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Grid for other filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* Page Filter */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                <div 
                  onClick={() => setCollapsePage(!collapsePage)}
                  style={{
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                      Page Filter
                    </span>
                    {selectedPage !== 'all' && (
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#64748b',
                    transition: 'transform 0.3s',
                    transform: collapsePage ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {!collapsePage && (
                  <div style={{ padding: '16px' }}>
                    <select
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: selectedPage !== 'all' ? '2px solid #10b981' : '2px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        outline: 'none',
                        fontWeight: '500',
                        color: '#1e293b',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => {
                        if (selectedPage === 'all') e.target.style.borderColor = '#e2e8f0'
                      }}
                    >
                      <option value="all">🌐 All Pages</option>
                      {availablePages.map(page => (
                        <option key={page} value={page.toString()}>📄 Page {page}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Word Count Range */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                <div 
                  onClick={() => setCollapseWordCount(!collapseWordCount)}
                  style={{
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📝</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                      Word Count
                    </span>
                    {(minWordCount || maxWordCount) && (
                      <span style={{
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#64748b',
                    transition: 'transform 0.3s',
                    transform: collapseWordCount ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {!collapseWordCount && (
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={minWordCount}
                        onChange={(e) => setMinWordCount(e.target.value)}
                        placeholder="Min"
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          border: minWordCount ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => {
                          if (!minWordCount) e.target.style.borderColor = '#e2e8f0'
                        }}
                      />
                      <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>→</span>
                      <input
                        type="number"
                        value={maxWordCount}
                        onChange={(e) => setMaxWordCount(e.target.value)}
                        placeholder="Max"
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          border: maxWordCount ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => {
                          if (!maxWordCount) e.target.style.borderColor = '#e2e8f0'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Character Count Range */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}>
                <div 
                  onClick={() => setCollapseCharCount(!collapseCharCount)}
                  style={{
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🔤</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                      Character Count
                    </span>
                    {(minCharCount || maxCharCount) && (
                      <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#64748b',
                    transition: 'transform 0.3s',
                    transform: collapseCharCount ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {!collapseCharCount && (
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={minCharCount}
                        onChange={(e) => setMinCharCount(e.target.value)}
                        placeholder="Min"
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          border: minCharCount ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => {
                          if (!minCharCount) e.target.style.borderColor = '#e2e8f0'
                        }}
                      />
                      <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>→</span>
                      <input
                        type="number"
                        value={maxCharCount}
                        onChange={(e) => setMaxCharCount(e.target.value)}
                        placeholder="Max"
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          border: maxCharCount ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => {
                          if (!maxCharCount) e.target.style.borderColor = '#e2e8f0'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Results Summary */}
            <div style={{ 
              marginTop: '24px', 
              padding: '16px 20px', 
              background: filteredParagraphs.length === paragraphs.length 
                ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              color: filteredParagraphs.length === paragraphs.length ? '#065f46' : '#92400e',
              border: filteredParagraphs.length === paragraphs.length ? '2px solid #6ee7b7' : '2px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart size={18} />
                <span>
                  <strong>Results:</strong> Showing {filteredParagraphs.length} of {paragraphs.length} paragraphs
                </span>
              </div>
              {filteredParagraphs.length !== paragraphs.length && (
                <span style={{ 
                  color: '#dc2626', 
                  fontWeight: '600',
                  background: '#fee2e2',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  {paragraphs.length - filteredParagraphs.length} filtered out
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {currentView === 'analytics' ? (
        <DataAnalytics 
          paragraphs={paragraphs}
          filename={file.filename}
          processingInfo={processingInfo || undefined}
        />
      ) : currentView === 'nlp' ? (
        <div className="nlp-analysis-view">
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '20px'
          }}>
            <Sparkles size={24} color="#8b5cf6" />
            NLP Analysis
          </h3>
          
          {nlpError && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ color: '#dc2626' }}>{nlpError}</span>
            </div>
          )}
          
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, color: '#0c4a6e' }}>
                <strong>📊 Analyze your paragraphs with NLP:</strong> Click the "Analyze" button next to any paragraph to see entities, keywords, sentiment, and statistics.
              </p>
            </div>
          </div>
          
          <div>
            {filteredParagraphs.map((paragraph) => {
              const analysis = nlpAnalysis.get(paragraph.id)
              const isAnalyzing = analyzingParagraph === paragraph.id
              
              return (
                <div
                  key={paragraph.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    background: analysis ? '#faf5ff' : 'white'
                  }}
                >
                  {/* Paragraph Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginBottom: '8px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        <span>Page {paragraph.page}</span>
                        <span>•</span>
                        <span>Paragraph {paragraph.paragraph_index + 1}</span>
                        <span>•</span>
                        <span>{paragraph.word_count} words</span>
                        {analysis && (
                          <>
                            <span>•</span>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              background: '#ede9fe',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#8b5cf6'
                            }}>
                              <Sparkles size={12} />
                              Analyzed
                            </span>
                          </>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.6',
                        color: '#374151'
                      }}>
                        {analysis && analysis.entities && analysis.entities.length > 0 ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: highlightEntities(paragraph.text, analysis.entities)
                            }}
                          />
                        ) : (
                          paragraph.text
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => analyzeParagraph(paragraph.id)}
                      disabled={isAnalyzing}
                      style={{
                        marginLeft: '16px',
                        background: analysis ? '#10b981' : '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: isAnalyzing ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader size={14} className="spinner" />
                          Analyzing...
                        </>
                      ) : analysis ? (
                        <>
                          <Sparkles size={14} />
                          Re-analyze
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Analysis Results */}
                  {analysis && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '2px solid #e9d5ff'
                    }}>
                      {/* Entities */}
                      {analysis.entities && analysis.entities.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ 
                            margin: '0 0 10px',
                            fontSize: '14px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Tag size={14} />
                            Entities ({analysis.entities.length})
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {analysis.entities.map((entity, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  background: `${getEntityColor(entity.label)}20`,
                                  border: `1px solid ${getEntityColor(entity.label)}40`,
                                  color: getEntityColor(entity.label)
                                }}
                              >
                                <strong>{entity.text}</strong>
                                <span style={{
                                  fontSize: '10px',
                                  background: getEntityColor(entity.label),
                                  color: 'white',
                                  padding: '1px 4px',
                                  borderRadius: '6px'
                                }}>
                                  {entity.label}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Keywords */}
                      {analysis.keywords && analysis.keywords.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ 
                            margin: '0 0 10px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            Top Keywords ({analysis.keywords.length})
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {analysis.keywords.slice(0, 5).map((keyword, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  background: '#e0e7ff',
                                  color: '#4f46e5',
                                  fontWeight: '500'
                                }}
                              >
                                {keyword.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Sentiment */}
                      {analysis.sentiment && (
                        <div style={{ marginBottom: '0' }}>
                          <h4 style={{ 
                            margin: '0 0 10px',
                            fontSize: '14px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Heart size={14} />
                            Sentiment
                          </h4>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: `${getSentimentColor(analysis.sentiment.sentiment)}15`,
                            border: `1px solid ${getSentimentColor(analysis.sentiment.sentiment)}40`
                          }}>
                            <span style={{ fontSize: '18px' }}>
                              {getSentimentIcon(analysis.sentiment.sentiment)}
                            </span>
                            <span style={{
                              fontWeight: '600',
                              color: getSentimentColor(analysis.sentiment.sentiment),
                              textTransform: 'capitalize'
                            }}>
                              {analysis.sentiment.sentiment}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              ({(analysis.sentiment.confidence * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="parse-viewer">
          <h3>
            Extracted Text ({filteredParagraphs.length} paragraphs
            {filteredParagraphs.length !== paragraphs.length && (
              <span style={{ color: '#6b7280', fontWeight: 'normal' }}>
                {' '}of {paragraphs.length} total
              </span>
            )})
          </h3>
          
          {paragraphs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No text content found in this document.</p>
              <button onClick={() => parseFile()}>Try with OCR</button>
            </div>
          ) : filteredParagraphs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No paragraphs match your current filters.</p>
              <button onClick={clearFilters} style={{ 
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              {filteredParagraphs.map((paragraph) => (
                <div
                  key={paragraph.id}
                  className={`paragraph ${selectedParagraph === paragraph.id ? 'selected' : ''}`}
                  onClick={() => handleParagraphClick(paragraph.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    Page {paragraph.page} • Paragraph {paragraph.paragraph_index + 1} • 
                    {paragraph.word_count} words • {paragraph.char_count} chars
                  </div>
                  <div>{paragraph.text}</div>
                  
                  {selectedParagraph === paragraph.id && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <strong>Paragraph Details:</strong>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        <li>ID: {paragraph.id}</li>
                        <li>Page: {paragraph.page}</li>
                        <li>Index: {paragraph.paragraph_index}</li>
                        <li>Word count: {paragraph.word_count}</li>
                        <li>Character count: {paragraph.char_count}</li>
                      </ul>
                      <button 
                        style={{ marginTop: '10px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          alert('Annotation feature coming soon!')
                        }}
                      >
                        Add Annotation
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

export default ParseViewer
