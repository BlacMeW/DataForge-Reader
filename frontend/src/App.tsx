import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ParseViewer from './components/ParseViewer'
import { BookOpen } from 'lucide-react'

export interface UploadedFile {
  file_id: string
  filename: string
  file_type: string
  file_size: number
}

export interface ParsedParagraph {
  id: string
  page: number
  paragraph_index: number
  text: string
  word_count: number
  char_count: number
  annotations: Record<string, unknown>
}

function App() {
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 0'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BookOpen size={32} color="#1e40af" style={{ marginRight: '12px' }} />
            <h1 style={{ margin: 0, fontSize: '28px' }}>DataForge Reader</h1>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Upload • Parse • Annotate • Export
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 0' }}>
        {currentFile ? (
          <ParseViewer 
            file={currentFile} 
            onClose={() => setCurrentFile(null)}
          />
        ) : (
          <FileUpload onFileUploaded={setCurrentFile} />
        )}
      </main>

      <footer style={{ 
        background: 'white', 
        borderTop: '1px solid #e5e7eb',
        padding: '20px 0',
        marginTop: 'auto',
        textAlign: 'center',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Built with React and FastAPI for ML Dataset Creation
      </footer>
    </div>
  )
}

export default App