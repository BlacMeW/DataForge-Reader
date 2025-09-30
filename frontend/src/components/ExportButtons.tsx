import React, { useState } from 'react'
import axios from 'axios'
import { Download } from 'lucide-react'

interface ExportButtonsProps {
  fileId: string
  disabled?: boolean
}

const API_BASE_URL = 'http://localhost:8000/api'

const ExportButtons: React.FC<ExportButtonsProps> = ({ fileId, disabled = false }) => {
  const [exportLoading, setExportLoading] = useState(false)

  const exportData = async (format: 'csv' | 'jsonl') => {
    if (disabled || exportLoading) return
    
    setExportLoading(true)
    try {
      // First, trigger export generation
      const exportResponse = await axios.post(`${API_BASE_URL}/export`, {
        file_id: fileId,
        format: format,
        include_annotations: false
      })

      if (exportResponse.data.download_url) {
        // Download the file
        const downloadUrl = `${API_BASE_URL}${exportResponse.data.download_url}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = exportResponse.data.filename
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert(`Successfully exported ${exportResponse.data.record_count} records to ${format.toUpperCase()} format!`)
      }
    } catch (err) {
      console.error('Export failed:', err)
      if (axios.isAxiosError(err)) {
        alert(`Export failed: ${err.response?.data?.detail || 'Unknown error'}`)
      } else {
        alert('Export failed: Unknown error')
      }
    }
    setExportLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button 
        onClick={() => exportData('csv')}
        disabled={disabled || exportLoading}
        style={{ 
          backgroundColor: '#10b981',
          color: 'white',
          opacity: (disabled || exportLoading) ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: (disabled || exportLoading) ? 'not-allowed' : 'pointer'
        }}
      >
        {exportLoading ? 'Loading...' : <><Download size={16} /> Export CSV</>}
      </button>
      <button 
        onClick={() => exportData('jsonl')}
        disabled={disabled || exportLoading}
        style={{ 
          backgroundColor: '#3b82f6',
          color: 'white',
          opacity: (disabled || exportLoading) ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: (disabled || exportLoading) ? 'not-allowed' : 'pointer'
        }}
      >
        {exportLoading ? 'Loading...' : <><Download size={16} /> Export JSONL</>}
      </button>
    </div>
  )
}

export default ExportButtons