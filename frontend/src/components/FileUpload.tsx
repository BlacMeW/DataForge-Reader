import React, { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import axios from 'axios'
import { Upload, CheckCircle, AlertCircle, Loader, FileText, AlertTriangle } from 'lucide-react'
import type { UploadedFile } from '../App'

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setErrorMessage('File too large. Maximum size is 50MB.')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setErrorMessage('Invalid file type. Please upload PDF or EPUB files only.')
      } else {
        setErrorMessage('File rejected. Please check file type and size.')
      }
      setUploadStatus('error')
      return
    }

    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Additional validation
    const allowedTypes = ['application/pdf', 'application/epub+zip']
    const isValidFile = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pdf') || 
                       file.name.toLowerCase().endsWith('.epub')
    
    if (!isValidFile) {
      setErrorMessage('Please upload only PDF or EPUB files')
      setUploadStatus('error')
      return
    }

    // Show file preview first
    setSelectedFile(file)
    setShowPreview(true)
  }, [])

  const confirmUpload = useCallback(async () => {
    if (!selectedFile) return

    setShowPreview(false)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      setUploadStatus('success')
      
      const uploadedFile: UploadedFile = {
        file_id: response.data.file_id,
        filename: response.data.filename,
        file_type: response.data.file_type,
        file_size: response.data.file_size
      }
      
      onFileUploaded(uploadedFile)
      
    } catch (error) {
      setUploadStatus('error')
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.detail || 'Upload failed')
      } else {
        setErrorMessage('Upload failed: Unknown error')
      }
    }
  }, [selectedFile, onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  return (
    <div className="container">
      <div className="header">
        <h2>Upload Your Document</h2>
        <p>Upload PDF or EPUB files to extract and annotate text content</p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'dragover' : ''}`}
        style={{ 
          opacity: uploadStatus === 'uploading' ? 0.7 : 1,
          pointerEvents: uploadStatus === 'uploading' ? 'none' : 'auto',
          borderColor: isDragActive ? '#3b82f6' : uploadStatus === 'error' ? '#dc2626' : '#d1d5db',
          backgroundColor: isDragActive ? '#eff6ff' : uploadStatus === 'error' ? '#fef2f2' : 'white',
          transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <input {...getInputProps()} />
        
        <div style={{ textAlign: 'center' }}>
          {uploadStatus === 'uploading' ? (
            <Loader size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          ) : uploadStatus === 'success' ? (
            <CheckCircle size={48} color="#10b981" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle size={48} color="#dc2626" />
          ) : (
            <Upload size={48} color="#9ca3af" />
          )}

          <div style={{ marginTop: '20px' }}>
            {uploadStatus === 'uploading' ? (
              <div>
                <h3>Uploading... {uploadProgress}%</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="success">
                <h3>Upload successful!</h3>
                <p>Processing your document...</p>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="error">
                <h3>Upload failed</h3>
                <p>{errorMessage}</p>
                <button onClick={() => setUploadStatus('idle')}>Try Again</button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: isDragActive ? '#3b82f6' : '#374151' }}>
                  {isDragActive ? '📁 Drop your file here!' : 'Drag & drop your PDF or EPUB file here'}
                </h3>
                <p style={{ color: '#6b7280', margin: '10px 0' }}>or click to select a file</p>
                
                {/* File format indicators */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '20px', 
                  margin: '20px 0',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#374151'
                  }}>
                    <FileText size={14} />
                    PDF
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#374151'
                  }}>
                    <FileText size={14} />
                    EPUB
                  </div>
                </div>
                
                <small style={{ color: '#9ca3af' }}>
                  Maximum file size: 50MB
                  {isDragActive && (
                    <div style={{ marginTop: '8px', color: '#3b82f6', fontWeight: '500' }}>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Release to upload
                    </div>
                  )}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {showPreview && selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <FileText size={32} color="#3b82f6" />
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>File Preview</h3>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                  Review file details before uploading
                </p>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Filename:</span>
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: '500' }}>
                    {selectedFile.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Size:</span>
                  <span style={{ color: '#111827', fontSize: '14px' }}>
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Type:</span>
                  <span style={{ 
                    color: '#111827', 
                    fontSize: '14px',
                    backgroundColor: '#e5e7eb',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {selectedFile.type || 'Unknown'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Last Modified:</span>
                  <span style={{ color: '#111827', fontSize: '14px' }}>
                    {new Date(selectedFile.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedFile(null)
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={16} />
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload