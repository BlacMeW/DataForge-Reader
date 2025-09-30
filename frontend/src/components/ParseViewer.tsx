import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BookOpen, Loader, AlertCircle } from 'lucide-react'
import type { UploadedFile, ParsedParagraph } from '../App'
import ExportButtons from './ExportButtons'

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

  useEffect(() => {
    parseFile()
  }, [file.file_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseFile = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post(`${API_BASE_URL}/parse`, {
        file_id: file.file_id,
        use_ocr: false
      })

      setParagraphs(response.data.paragraphs)
      setProcessingInfo({
        totalPages: response.data.total_pages,
        extractionMethod: response.data.extraction_method,
        processingTime: response.data.processing_time
      })
      setLoading(false)
    } catch (err) {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader size={48} color="#3b82f6" />
          <h3 style={{ marginTop: '20px' }}>Processing your document...</h3>
          <p>Extracting text content from {file.filename}</p>
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
            <ExportButtons fileId={file.file_id} disabled={paragraphs.length === 0} />
          </>
        )}
      </div>

      <div className="parse-viewer">
        <h3>Extracted Text ({paragraphs.length} paragraphs)</h3>
        
        {paragraphs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No text content found in this document.</p>
            <button onClick={() => parseFile()}>Try with OCR</button>
          </div>
        ) : (
          <div>
            {paragraphs.map((paragraph) => (
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
    </div>
  )
}

export default ParseViewer
