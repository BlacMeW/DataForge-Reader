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

export interface ParsedContent {
  file_id: string
  filename: string
  total_pages: number
  paragraphs: ParsedParagraph[]
  extraction_method: string
  processing_time: number
}

function App() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null)
  const [currentView, setCurrentView] = useState<'upload' | 'parse'>('upload')

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFile(file)
    setParsedContent(null)
    setCurrentView('parse')
  }

  const handleContentParsed = (content: ParsedContent) => {
    setParsedContent(content)
  }

  const handleBackToUpload = () => {
    setCurrentView('upload')
    setUploadedFile(null)
    setParsedContent(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                DataForge Reader
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Upload • Parse • Annotate • Export
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'upload' ? (
          <FileUpload onFileUploaded={handleFileUploaded} />
        ) : (
          <ParseViewer
            uploadedFile={uploadedFile}
            parsedContent={parsedContent}
            onContentParsed={handleContentParsed}
            onBackToUpload={handleBackToUpload}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            Built with React, TailwindCSS, and FastAPI
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
