import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ParseViewer from './components/ParseViewer'
import DatasetTemplateSelector from './components/DatasetTemplateSelector'
import CustomTemplateDesigner from './components/CustomTemplateDesigner'
import ProjectManager, { type Project } from './components/ProjectManager'
import UserGuide from './components/UserGuide'
import { useKeyboardShortcuts, showKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BookOpen, Settings, Folder, Keyboard, HelpCircle } from 'lucide-react'

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

interface DatasetTemplate {
  id: string
  name: string
  description: string
  fields: Array<{
    name: string
    type: string
    description: string
    options?: string[]
    optional?: boolean
  }>
  annotation_schema: {
    type: string
    options?: string[]
    instructions: string
  }
}

type AppView = 'upload' | 'parse' | 'templates' | 'custom-template' | 'projects'

function App() {
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null)
  const [currentView, setCurrentView] = useState<AppView>('upload')
  const [selectedTemplate, setSelectedTemplate] = useState<DatasetTemplate | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showUserGuide, setShowUserGuide] = useState<boolean>(false)

  // Define keyboard shortcuts
  const keyboardShortcuts = [
    {
      key: '1',
      ctrlKey: true,
      callback: () => setCurrentView('upload'),
      description: 'Go to File Upload'
    },
    {
      key: '2', 
      ctrlKey: true,
      callback: () => setCurrentView('projects'),
      description: 'Go to Projects'
    },
    {
      key: '3',
      ctrlKey: true,
      callback: () => setCurrentView('templates'),
      description: 'Go to Templates'
    },
    {
      key: 'h',
      ctrlKey: true,
      callback: () => showKeyboardShortcuts(keyboardShortcuts),
      description: 'Show Keyboard Shortcuts'
    },
    {
      key: 'F1',
      callback: () => setShowUserGuide(true),
      description: 'Open User Guide'
    },
    {
      key: 'Escape',
      callback: () => {
        if (currentFile) setCurrentFile(null)
        if (selectedTemplate) setSelectedTemplate(null)
      },
      description: 'Close current file/template'
    }
  ]

  // Enable keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts, true)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setCurrentView('upload')}
              style={{ 
                background: currentView === 'upload' ? '#e0e7ff' : 'transparent',
                color: currentView === 'upload' ? '#1e40af' : '#6b7280',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              File Upload
            </button>
            <button 
              onClick={() => setCurrentView('projects')}
              style={{ 
                background: currentView === 'projects' ? '#e0e7ff' : 'transparent',
                color: currentView === 'projects' ? '#1e40af' : '#6b7280',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Folder size={16} style={{ marginRight: '6px' }} />
              Projects
            </button>
            <button 
              onClick={() => setCurrentView('templates')}
              style={{ 
                background: currentView === 'templates' ? '#e0e7ff' : 'transparent',
                color: currentView === 'templates' ? '#1e40af' : '#6b7280',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Settings size={16} style={{ marginRight: '6px' }} />
              Templates
            </button>
            
            <div style={{ borderLeft: '1px solid #e5e7eb', height: '24px', margin: '0 8px' }}></div>
            
            <button 
              onClick={() => setShowUserGuide(true)}
              style={{ 
                background: 'none',
                color: '#6b7280',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="User Guide & Documentation"
            >
              <HelpCircle size={16} />
            </button>
            
            <button 
              onClick={() => showKeyboardShortcuts(keyboardShortcuts)}
              style={{ 
                background: 'none',
                color: '#6b7280',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Keyboard Shortcuts (Ctrl+H)"
            >
              <Keyboard size={16} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 0' }}>
        {currentView === 'upload' && (
          <>
            {selectedTemplate && (
              <div style={{ 
                background: '#f0f9ff', 
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '15px',
                margin: '0 auto 20px',
                maxWidth: '800px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>Selected Template:</strong> {selectedTemplate.name}
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      {selectedTemplate.description}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#6b7280', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            {currentFile ? (
              <ParseViewer 
                file={currentFile} 
                onClose={() => setCurrentFile(null)}
              />
            ) : (
              <FileUpload onFileUploaded={setCurrentFile} />
            )}
          </>
        )}
        
        {currentView === 'templates' && (
          <DatasetTemplateSelector 
            onTemplateSelected={(template) => {
              setSelectedTemplate(template)
              setCurrentView('upload')
            }}
            onCustomTemplate={() => setCurrentView('custom-template')}
          />
        )}
        
        {currentView === 'custom-template' && (
          <CustomTemplateDesigner 
            onTemplateCreated={(template) => {
              setSelectedTemplate(template)
              setCurrentView('templates')
            }}
            onBack={() => setCurrentView('templates')}
          />
        )}
        
        {currentView === 'projects' && (
          <ProjectManager 
            onProjectSelect={setCurrentProject}
            onFileSelect={(file) => {
              setCurrentFile(file)
              setCurrentView('parse')
            }}
            currentProject={currentProject || undefined}
          />
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

      {/* User Guide Modal */}
      <UserGuide 
        isOpen={showUserGuide} 
        onClose={() => setShowUserGuide(false)} 
      />
    </div>
  )
}

export default App