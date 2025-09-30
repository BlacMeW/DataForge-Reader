import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { BookOpen, Loader, AlertCircle, Search, Filter, X, BarChart } from 'lucide-react'
import type { UploadedFile, ParsedParagraph } from '../App'
import ExportButtons from './ExportButtons'
import DataAnalytics from './DataAnalytics'

interface ParseViewerProps {
  file: UploadedFile
  onClose: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const ParseViewer: React.FC<ParseViewerProps> = ({ file, onClose }) => {
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
  const [currentView, setCurrentView] = useState<'content' | 'analytics'>('content')

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
      })

      // Step 3: Processing response
      setProcessingStep('Organizing extracted content...')
      setProcessingProgress(70)
      
      setParagraphs(response.data.paragraphs)
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
            <button 
              onClick={() => setCurrentView(currentView === 'content' ? 'analytics' : 'content')}
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
              {currentView === 'analytics' ? 'Show Content' : 'Show Analytics'}
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

      {/* Filter Panel */}
      {paragraphs.length > 0 && showFilters && (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="#475569" />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '16px', fontWeight: '600' }}>
                Filter & Search
              </h4>
              <span style={{ 
                background: '#e2e8f0', 
                color: '#64748b', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                {filteredParagraphs.length} of {paragraphs.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  backgroundColor: showFilters ? '#3b82f6' : '#f1f5f9',
                  color: showFilters ? 'white' : '#64748b',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                <Filter size={12} />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={clearFilters}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                <X size={12} />
                Clear All
              </button>
            </div>
          </div>
          
          {/* Quick Search - Always Visible */}
          <div style={{ padding: '16px 20px', borderBottom: showFilters ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Quick search in paragraphs..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
          
          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div style={{ padding: '20px', background: '#fafbfc' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Advanced Search Options */}
                <div style={{ 
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h5 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Search size={14} />
                    Advanced Search
                  </h5>
                  
                  {/* Search Mode Toggle */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    <button
                      onClick={() => setSearchMode('text')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: searchMode === 'text' ? '#3b82f6' : 'white',
                        color: searchMode === 'text' ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      Text Search
                    </button>
                    <button
                      onClick={() => setSearchMode('regex')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: searchMode === 'regex' ? '#3b82f6' : 'white',
                        color: searchMode === 'regex' ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      RegEx
                    </button>
                  </div>
                  
                  {/* Regex Error */}
                  {regexError && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#ef4444', 
                      marginBottom: '8px',
                      background: '#fef2f2',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      {regexError}
                    </div>
                  )}
                  
                  {/* Search Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      color: '#4b5563'
                    }}>
                      <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                        style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                      />
                      Case sensitive matching
                    </label>
                    {searchMode === 'text' && (
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        color: '#4b5563'
                      }}>
                        <input
                          type="checkbox"
                          checked={wholeWords}
                          onChange={(e) => setWholeWords(e.target.checked)}
                          style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                        />
                        Match whole words only
                      </label>
                    )}
                  </div>
                </div>

                {/* Filters Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '16px'
                }}>
                  {/* Page Filter */}
                  <div style={{ 
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      📄 Page
                    </label>
                    <select
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="all">All Pages</option>
                      {availablePages.map(page => (
                        <option key={page} value={page.toString()}>Page {page}</option>
                      ))}
                    </select>
                  </div>

                  {/* Word Count Range */}
                  <div style={{ 
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      📝 Word Count
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="number"
                        value={minWordCount}
                        onChange={(e) => setMinWordCount(e.target.value)}
                        placeholder="Min"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={maxWordCount}
                        onChange={(e) => setMaxWordCount(e.target.value)}
                        placeholder="Max"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Character Count Range */}
                  <div style={{ 
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      🔤 Character Count
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="number"
                        value={minCharCount}
                        onChange={(e) => setMinCharCount(e.target.value)}
                        placeholder="Min"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        value={maxCharCount}
                        onChange={(e) => setMaxCharCount(e.target.value)}
                        placeholder="Max"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Results Summary */}
          <div style={{ 
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            padding: '12px 20px',
            fontSize: '14px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong style={{ color: '#475569' }}>Results:</strong> Showing {filteredParagraphs.length} of {paragraphs.length} paragraphs
            </div>
            {filteredParagraphs.length !== paragraphs.length && (
              <div style={{ color: '#ef4444', fontSize: '13px' }}>
                {paragraphs.length - filteredParagraphs.length} filtered out
              </div>
            )}
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
    </div>
  )
}

export default ParseViewer
