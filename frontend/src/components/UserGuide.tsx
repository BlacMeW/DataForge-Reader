import React, { useState, useEffect } from 'react'
import { X, ExternalLink, Download } from 'lucide-react'

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && !content) {
      fetchUserGuide()
    }
  }, [isOpen, content])

  const fetchUserGuide = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:8000/api/user-guide')
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setContent(data.content || '')
      } else {
        setContent(data.content || '')
      }
    } catch (err) {
      setError('Failed to load user guide')
      console.error('Error fetching user guide:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMarkdownToHtml = (markdown: string): string => {
    const html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Lists
      .replace(/^[\s]*-[\s]+(.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Checkmarks and X marks
      .replace(/✅/g, '<span style="color: #059669;">✅</span>')
      .replace(/❌/g, '<span style="color: #dc2626;">❌</span>')
      .replace(/🔄/g, '<span style="color: #0891b2;">🔄</span>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    return `<div style="line-height: 1.6;"><p>${html}</p></div>`
  }

  const downloadGuide = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'DataForge-Reader-User-Guide.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openInNewTab = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DataForge Reader - User Guide</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6;
              color: #333;
            }
            h1, h2, h3 { color: #1e40af; margin-top: 2em; }
            h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            code { 
              background: #f3f4f6; 
              padding: 2px 4px; 
              border-radius: 3px; 
              font-family: 'Courier New', monospace;
            }
            pre { 
              background: #f9fafb; 
              padding: 15px; 
              border-radius: 6px; 
              overflow-x: auto;
              border-left: 4px solid #3b82f6;
            }
            ul { margin: 10px 0; }
            li { margin: 5px 0; }
            a { color: #3b82f6; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          ${formatMarkdownToHtml(content)}
        </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, color: '#1e40af', fontSize: '20px' }}>
            📚 DataForge Reader - User Guide
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={downloadGuide}
              style={{
                background: '#f3f4f6',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Download Guide"
            >
              <Download size={16} />
            </button>
            <button
              onClick={openInNewTab}
              style={{
                background: '#f3f4f6',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Open in New Tab"
            >
              <ExternalLink size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading user guide...</p>
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              color: '#dc2626'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {content && !loading && (
            <div 
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                lineHeight: '1.6',
                color: '#374151'
              }}
              dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(content) }}
            />
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default UserGuide