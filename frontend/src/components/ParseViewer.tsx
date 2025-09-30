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
      }, {
        timeout: 300000 // 5 minute timeout for large documents
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
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={20} />
              Filter Paragraphs
            </h4>
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <X size={14} />
              Clear All
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {/* Advanced Text Search */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                <Search size={16} style={{ display: 'inline', marginRight: '5px' }} />
                Advanced Search
              </label>
              
              {/* Search Mode Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={() => setSearchMode('text')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: searchMode === 'text' ? '#3b82f6' : 'white',
                    color: searchMode === 'text' ? 'white' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Text
                </button>
                <button
                  onClick={() => setSearchMode('regex')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: searchMode === 'regex' ? '#3b82f6' : 'white',
                    color: searchMode === 'regex' ? 'white' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Regex
                </button>
              </div>
              
              {/* Search Input */}
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchMode === 'regex' ? 'Enter regular expression...' : 'Search in paragraph text...'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${regexError ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
              />
              
              {/* Regex Error */}
              {regexError && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#dc2626', 
                  marginBottom: '8px' 
                }}>
                  {regexError}
                </div>
              )}
              
              {/* Search Options */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    style={{ marginRight: '6px' }}
                  />
                  Case sensitive
                </label>
                {searchMode === 'text' && (
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={wholeWords}
                      onChange={(e) => setWholeWords(e.target.checked)}
                      style={{ marginRight: '6px' }}
                    />
                    Whole words
                  </label>
                )}
              </div>
            </div>

            {/* Page Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                📄 Page
              </label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Pages</option>
                {availablePages.map(page => (
                  <option key={page} value={page.toString()}>Page {page}</option>
                ))}
              </select>
            </div>

            {/* Word Count Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                📝 Word Count
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={minWordCount}
                  onChange={(e) => setMinWordCount(e.target.value)}
                  placeholder="Min"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  value={maxWordCount}
                  onChange={(e) => setMaxWordCount(e.target.value)}
                  placeholder="Max"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Character Count Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                🔤 Character Count
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={minCharCount}
                  onChange={(e) => setMinCharCount(e.target.value)}
                  placeholder="Min"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  value={maxCharCount}
                  onChange={(e) => setMaxCharCount(e.target.value)}
                  placeholder="Max"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter Results Summary */}
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#e0f2fe', 
            borderRadius: '4px',
            fontSize: '14px',
            color: '#0369a1'
          }}>
            <strong>Filter Results:</strong> Showing {filteredParagraphs.length} of {paragraphs.length} paragraphs
            {filteredParagraphs.length !== paragraphs.length && (
              <span style={{ marginLeft: '10px', color: '#dc2626' }}>
                ({paragraphs.length - filteredParagraphs.length} filtered out)
              </span>
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
