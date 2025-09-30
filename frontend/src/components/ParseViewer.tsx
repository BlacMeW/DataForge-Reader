import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { ArrowLeft, Play, Loader, Eye, EyeOff, BookOpen, Clock, FileText } from 'lucide-react'
import type { UploadedFile, ParsedContent, ParsedParagraph } from '../App'

interface ParseViewerProps {
  uploadedFile: UploadedFile | null
  parsedContent: ParsedContent | null
  onContentParsed: (content: ParsedContent) => void
  onBackToUpload: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const ParseViewer: React.FC<ParseViewerProps> = ({
  uploadedFile,
  parsedContent,
  onContentParsed,
  onBackToUpload,
}) => {
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [useOCR, setUseOCR] = useState<boolean>(false)
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set())
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (uploadedFile && !parsedContent) {
      handleParse()
    }
  }, [uploadedFile, parsedContent])

  const handleParse = useCallback(async () => {
    if (!uploadedFile) return

    try {
      setParseStatus('parsing')
      setErrorMessage('')

      const response = await axios.post(`${API_BASE_URL}/parse`, {
        file_id: uploadedFile.file_id,
        use_ocr: useOCR,
      })

      setParseStatus('success')
      onContentParsed(response.data)
    } catch (error: unknown) {
      setParseStatus('error')
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.detail || error.message
        : error instanceof Error 
        ? error.message 
        : 'Parsing failed. Please try again.'
      setErrorMessage(errorMessage)
    }
  }, [uploadedFile, useOCR, onContentParsed])

  const toggleParagraphExpansion = (paragraphId: string) => {
    const newExpanded = new Set(expandedParagraphs)
    if (newExpanded.has(paragraphId)) {
      newExpanded.delete(paragraphId)
    } else {
      newExpanded.add(paragraphId)
    }
    setExpandedParagraphs(newExpanded)
  }

  const toggleParagraphSelection = (paragraphId: string) => {
    const newSelected = new Set(selectedParagraphs)
    if (newSelected.has(paragraphId)) {
      newSelected.delete(paragraphId)
    } else {
      newSelected.add(paragraphId)
    }
    setSelectedParagraphs(newSelected)
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const truncateText = (text: string, maxLength: number = 200): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  if (!uploadedFile) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No file uploaded</div>
        <button
          onClick={onBackToUpload}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToUpload}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </button>
        
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">{uploadedFile.filename}</h2>
          <p className="text-sm text-gray-500">
            {formatFileSize(uploadedFile.file_size)} • {uploadedFile.file_type.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Parse Controls */}
      {parseStatus === 'idle' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Text Extraction Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="use-ocr"
                type="checkbox"
                checked={useOCR}
                onChange={(e) => setUseOCR(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="use-ocr" className="ml-2 block text-sm text-gray-700">
                Force OCR (Use for scanned documents or better accuracy)
              </label>
            </div>
            
            <button
              onClick={handleParse}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Extract Text
            </button>
          </div>
        </div>
      )}

      {/* Parsing Status */}
      {parseStatus === 'parsing' && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center mb-6">
          <Loader className="mx-auto h-12 w-12 text-primary-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Extracting text from your document...
          </h3>
          <p className="text-gray-600">
            This may take a few moments, especially for scanned documents.
          </p>
        </div>
      )}

      {/* Parse Error */}
      {parseStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Text extraction failed
          </h3>
          <p className="text-red-700 mb-4">{errorMessage}</p>
          <div className="flex space-x-4">
            <button
              onClick={handleParse}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => setUseOCR(!useOCR)}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              {useOCR ? 'Try without OCR' : 'Try with OCR'}
            </button>
          </div>
        </div>
      )}

      {/* Parsed Content */}
      {parseStatus === 'success' && parsedContent && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{parsedContent.total_pages}</div>
                <div className="text-sm text-gray-500">Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{parsedContent.paragraphs.length}</div>
                <div className="text-sm text-gray-500">Paragraphs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {parsedContent.paragraphs.reduce((sum, p) => sum + p.word_count, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{parsedContent.processing_time}s</div>
                <div className="text-sm text-gray-500">Processing Time</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Method: {parsedContent.extraction_method}
              </span>
            </div>
          </div>

          {/* Paragraphs List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Extracted Text</h3>
                <div className="text-sm text-gray-500">
                  {selectedParagraphs.size} of {parsedContent.paragraphs.length} selected
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {parsedContent.paragraphs.map((paragraph: ParsedParagraph) => {
                const isExpanded = expandedParagraphs.has(paragraph.id)
                const isSelected = selectedParagraphs.has(paragraph.id)

                return (
                  <div
                    key={paragraph.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParagraphSelection(paragraph.id)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <BookOpen className="w-4 h-4" />
                            <span>Page {paragraph.page}</span>
                            <span>•</span>
                            <span>{paragraph.word_count} words</span>
                            <span>•</span>
                            <span>{paragraph.char_count} characters</span>
                          </div>
                          
                          <button
                            onClick={() => toggleParagraphExpansion(paragraph.id)}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Expand
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="text-gray-900">
                          {isExpanded ? paragraph.text : truncateText(paragraph.text)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          {selectedParagraphs.size > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actions for Selected Paragraphs ({selectedParagraphs.size})
              </h3>
              <div className="flex space-x-4">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Annotate Selected
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedParagraphs(new Set())}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ParseViewer