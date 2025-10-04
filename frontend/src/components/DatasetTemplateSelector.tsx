import React, { useState, useEffect } from 'react'
import { Settings, Zap, Brain, MessageSquare, FileText, Plus } from 'lucide-react'
import axios from 'axios'

interface DatasetTemplate {
  id: string
  name: string
  description: string
  task_type: string
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
  export_format: string
}

interface DatasetTemplateProps {
  onTemplateSelected: (template: DatasetTemplate) => void
  onCustomTemplate: () => void
  onManageTemplates: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const DatasetTemplateSelector: React.FC<DatasetTemplateProps> = ({ 
  onTemplateSelected, 
  onCustomTemplate,
  onManageTemplates
}) => {
  const [templates, setTemplates] = useState<DatasetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      console.log('Loading templates from:', `${API_BASE_URL}/dataset/templates`)
      const response = await axios.get(`${API_BASE_URL}/dataset/templates`)
      console.log('Templates loaded:', response.data)
      
      // Load custom templates
      let customTemplates: DatasetTemplate[] = []
      try {
        const customResponse = await axios.get(`${API_BASE_URL}/dataset/templates/custom`)
        customTemplates = customResponse.data.templates || []
        console.log('Custom templates loaded:', customTemplates)
      } catch (customError) {
        console.warn('Failed to load custom templates:', customError)
        // Don't fail completely if custom templates can't be loaded
      }
      
      // Combine predefined and custom templates
      const allTemplates = [...(response.data.templates || []), ...customTemplates]
      setTemplates(allTemplates)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load templates:', error)
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data)
        console.error('Status:', error.response?.status)
      }
      setTemplates([]) // Set empty array on error
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: DatasetTemplate) => {
    setSelectedTemplate(template.id)
    onTemplateSelected(template)
  }

  const getTemplateIcon = (taskType: string) => {
    switch (taskType) {
      case 'classification': return <Brain size={24} color="#3b82f6" />
      case 'ner': return <Zap size={24} color="#10b981" />
      case 'qa': return <MessageSquare size={24} color="#f59e0b" />
      case 'summarization': return <FileText size={24} color="#8b5cf6" />
      default: return <Settings size={24} color="#6b7280" />
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading dataset templates...</p>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="container">
        <div className="header">
          <h2>Choose Dataset Template</h2>
          <p>Select a predefined template or create a custom dataset structure</p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#dc2626', marginBottom: '20px' }}>
            ⚠️ Unable to load predefined templates. Please check if the backend server is running.
          </p>
          <button 
            onClick={loadTemplates}
            style={{ 
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Retry Loading Templates
          </button>
          <button 
            onClick={onCustomTemplate}
            style={{ 
              backgroundColor: '#10b981',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Custom Template
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h2>Choose Dataset Template</h2>
        <p>Select a predefined template or create a custom dataset structure</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`file-info ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedTemplate === template.id ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              {getTemplateIcon(template.task_type)}
              <div style={{ marginLeft: '12px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{template.name}</h3>
                  {template.task_type === 'custom' && (
                    <span style={{ 
                      fontSize: '10px', 
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontWeight: 'bold'
                    }}>
                      CUSTOM
                    </span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}>
                  {template.task_type === 'custom' ? 'Custom Template' : template.task_type}
                </span>
              </div>
            </div>
            
            <p style={{ color: '#4b5563', marginBottom: '15px' }}>
              {template.description}
            </p>
            
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <strong>Fields:</strong> {template.fields.map(f => f.name).join(', ')}
              <br />
              <strong>Export:</strong> {template.export_format.toUpperCase()}
            </div>
            
            {selectedTemplate === template.id && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px',
                background: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <strong>Annotation:</strong> {template.annotation_schema.instructions}
              </div>
            )}
          </div>
        ))}

        {/* Custom Template Option */}
        <div
          className="file-info"
          onClick={onCustomTemplate}
          style={{ 
            cursor: 'pointer',
            border: '2px dashed #d1d5db',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px'
          }}
        >
          <Plus size={48} color="#9ca3af" />
          <h3 style={{ marginTop: '15px', color: '#4b5563' }}>Custom Template</h3>
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Create your own dataset structure with custom fields and annotation schema
          </p>
        </div>

        {/* Manage Custom Templates Option */}
        {templates.some(t => t.task_type === 'custom') && (
          <div
            className="file-info"
            onClick={onManageTemplates}
            style={{ 
              cursor: 'pointer',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              background: '#f9fafb'
            }}
          >
            <Settings size={48} color="#6b7280" />
            <h3 style={{ marginTop: '15px', color: '#4b5563' }}>Manage Templates</h3>
            <p style={{ textAlign: 'center', color: '#6b7280' }}>
              Edit and delete your saved custom templates
            </p>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => {
              const template = templates.find(t => t.id === selectedTemplate)
              if (template) onTemplateSelected(template)
            }}
            style={{ 
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Use This Template →
          </button>
        </div>
      )}
    </div>
  )
}

export default DatasetTemplateSelector