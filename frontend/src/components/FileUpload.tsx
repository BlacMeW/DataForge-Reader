import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import type { UploadedFile } from '../App'

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/epub+zip']
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.epub')) {
      setErrorMessage('Please upload only PDF or EPUB files')
      setUploadStatus('error')
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setErrorMessage('File size must be less than 50MB')
      setUploadStatus('error')
      return
    }

    try {
      setUploadStatus('uploading')
      setErrorMessage('')
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        },
      })

      setUploadStatus('success')
      onFileUploaded(response.data)
    } catch (error: unknown) {
      setUploadStatus('error')
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.detail || error.message
        : error instanceof Error 
        ? error.message 
        : 'Upload failed. Please try again.'
      setErrorMessage(errorMessage)
    }
  }, [onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setErrorMessage('')
    setUploadProgress(0)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Document
        </h2>
        <p className="text-lg text-gray-600">
          Upload PDF or EPUB files to extract and annotate text content
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 
            uploadStatus === 'error' ? 'border-red-300 bg-red-50' :
            uploadStatus === 'success' ? 'border-green-300 bg-green-50' :
            'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'idle' && (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-xl font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag and drop your file here'}
            </div>
            <div className="text-gray-600 mb-4">
              or click to browse
            </div>
            <div className="text-sm text-gray-500">
              Supported formats: PDF, EPUB (max 50MB)
            </div>
          </>
        )}

        {uploadStatus === 'uploading' && (
          <div className="space-y-4">
            <Loader className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
            <div className="text-xl font-medium text-gray-900">
              Uploading... {uploadProgress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <div className="text-xl font-medium text-gray-900">
              Upload successful!
            </div>
            <div className="text-gray-600">
              Redirecting to text extraction...
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <div className="text-xl font-medium text-gray-900">
              Upload failed
            </div>
            <div className="text-red-600 mb-4">
              {errorMessage}
            </div>
            <button
              onClick={resetUpload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* File Format Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Supported Features
        </h3>
        <ul className="text-blue-800 space-y-1">
          <li>• <strong>PDF files:</strong> Both text-based and scanned PDFs with OCR</li>
          <li>• <strong>EPUB files:</strong> Extract text from e-book format</li>
          <li>• <strong>Automatic detection:</strong> Smart fallback to OCR for scanned documents</li>
          <li>• <strong>Text annotation:</strong> Label and structure extracted content</li>
          <li>• <strong>Export formats:</strong> CSV and JSONL (HuggingFace compatible)</li>
        </ul>
      </div>
    </div>
  )
}

export default FileUpload