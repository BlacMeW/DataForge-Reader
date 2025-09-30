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
    const isValidFile = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pdf') || 
                       file.name.toLowerCase().endsWith('.epub')
    
    if (!isValidFile) {
      setErrorMessage('Please upload only PDF or EPUB files')
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', file)

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
          pointerEvents: uploadStatus === 'uploading' ? 'none' : 'auto'
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
                <h3>{isDragActive ? 'Drop your file here' : 'Drag & drop your PDF or EPUB file here'}</h3>
                <p>or click to select a file</p>
                <small>Supported formats: PDF, EPUB (max 50MB)</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUpload