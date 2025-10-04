import React, { useState, useEffect } from 'react'
import { Settings, Zap, Brain, MessageSquare, FileText, Plus, Search, Eye, Clock, BarChart3 } from 'lucide-react'
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
  created_at?: string
  usage_count?: number
}

interface DatasetTemplateProps {
  onTemplateSelected: (template: DatasetTemplate) => void
  onCustomTemplate: () => void
  onManageTemplates: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

// Template categories
const TEMPLATE_CATEGORIES = {
  nlp: {
    name: 'Natural Language Processing',
    icon: <Brain size={20} color="#3b82f6" />,
    types: ['classification', 'ner', 'qa', 'summarization']
  },
  custom: {
    name: 'Custom Templates',
    icon: <Settings size={20} color="#6b7280" />,
    types: ['custom']
  }
}

const DatasetTemplateSelector: React.FC<DatasetTemplateProps> = ({
  onTemplateSelected,
  onCustomTemplate,
  onManageTemplates
}) => {
  const [templates, setTemplates] = useState<DatasetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [recentTemplates, setRecentTemplates] = useState<string[]>([])

  // Add responsive styles
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media (min-width: 640px) {
        .search-controls {
          flex-direction: row !important;
        }
        .search-controls > div:first-child {
          flex: 1 !important;
        }
        .search-controls > div:last-child {
          flex: 0 0 auto !important;
          max-width: 300px !important;
        }
      }
      @media (max-width: 480px) {
        .template-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
    loadRecentTemplates()
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

  const loadRecentTemplates = () => {
    const recent = localStorage.getItem('recentTemplates')
    if (recent) {
      setRecentTemplates(JSON.parse(recent))
    }
  }

  const saveRecentTemplate = (templateId: string) => {
    const updated = [templateId, ...recentTemplates.filter(id => id !== templateId)].slice(0, 5)
    setRecentTemplates(updated)
    localStorage.setItem('recentTemplates', JSON.stringify(updated))
  }

  const handleTemplateSelect = (template: DatasetTemplate) => {
    setSelectedTemplate(template.id)
    saveRecentTemplate(template.id)
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

  const getTemplateCategory = (taskType: string) => {
    if (taskType === 'custom') return 'custom'
    return 'nlp'
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.task_type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || getTemplateCategory(template.task_type) === selectedCategory

    return matchesSearch && matchesCategory
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // Recent templates first
    const aRecent = recentTemplates.indexOf(a.id)
    const bRecent = recentTemplates.indexOf(b.id)
    if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent
    if (aRecent !== -1) return -1
    if (bRecent !== -1) return 1

    // Then custom templates
    if (a.task_type === 'custom' && b.task_type !== 'custom') return -1
    if (b.task_type === 'custom' && a.task_type !== 'custom') return 1

    // Then by name
    return a.name.localeCompare(b.name)
  })

  const generateSampleData = (template: DatasetTemplate): Record<string, unknown> => {
    const sample: Record<string, unknown> = {}
    template.fields.forEach(field => {
      switch (field.type) {
        case 'string':
          sample[field.name] = `Sample ${field.name}`
          break
        case 'integer':
          sample[field.name] = 42
          break
        case 'float':
          sample[field.name] = 3.14
          break
        case 'boolean':
          sample[field.name] = true
          break
        case 'categorical':
          sample[field.name] = field.options ? field.options[0] : 'category1'
          break
        case 'list':
          sample[field.name] = ['item1', 'item2', 'item3']
          break
        default:
          sample[field.name] = `Sample ${field.name}`
      }
    })
    return sample
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

      {/* Search and Filter Controls */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div className="search-controls" style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'stretch',
          flexDirection: 'column'
        }}>
          {/* Search Bar */}
          <div style={{ width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search templates by name, description, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Categories</option>
              <option value="nlp">Natural Language Processing</option>
              <option value="custom">Custom Templates</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#6b7280' }}>
          Showing {sortedTemplates.length} of {templates.length} templates
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${TEMPLATE_CATEGORIES[selectedCategory as keyof typeof TEMPLATE_CATEGORIES]?.name}`}
        </div>
      </div>

      {/* Recent Templates Section */}
      {recentTemplates.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Clock size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#374151' }}>Recent Templates</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {recentTemplates.slice(0, 3).map(templateId => {
              const template = templates.find(t => t.id === templateId)
              if (!template) return null

              return (
                <div
                  key={`recent-${template.id}`}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#fefefe',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    {getTemplateIcon(template.task_type)}
                    <span style={{ marginLeft: '8px', fontWeight: '500', fontSize: '14px' }}>
                      {template.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {template.task_type === 'custom' ? 'Custom Template' : template.task_type}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="template-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {sortedTemplates.map((template) => (
          <div
            key={template.id}
            className={`file-info ${selectedTemplate === template.id ? 'selected' : ''}`}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedTemplate === template.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              position: 'relative',
              padding: '20px',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Template Header with Stats */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                {getTemplateIcon(template.task_type)}
                <div style={{ marginLeft: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0
                    }}>
                      {template.name}
                    </h3>
                    {template.task_type === 'custom' && (
                      <span style={{
                        fontSize: '10px',
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {template.task_type === 'custom' ? 'Custom Template' : template.task_type}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      background: '#f3f4f6',
                      padding: '1px 6px',
                      borderRadius: '3px'
                    }}>
                      {TEMPLATE_CATEGORIES[getTemplateCategory(template.task_type) as keyof typeof TEMPLATE_CATEGORIES]?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Template Stats - Repositioned */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                {recentTemplates.includes(template.id) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={14} color="#6b7280" />
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Recent</span>
                  </div>
                )}
                {template.usage_count && (
                  <div style={{
                    fontSize: '10px',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <BarChart3 size={10} />
                    {template.usage_count}
                  </div>
                )}
              </div>
            </div>

            <p style={{ color: '#4b5563', marginBottom: '15px', lineHeight: '1.5' }}>
              {template.description}
            </p>

            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
              <div><strong>Fields:</strong> {template.fields.length} ({template.fields.map(f => f.name).join(', ')})</div>
              <div><strong>Export:</strong> {template.export_format.toUpperCase()}</div>
              {template.created_at && (
                <div><strong>Created:</strong> {new Date(template.created_at).toLocaleDateString()}</div>
              )}
            </div>

            {/* Preview Toggle */}
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPreview(showPreview === template.id ? null : template.id)
                }}
                style={{
                  fontSize: '12px',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0'
                }}
              >
                <Eye size={14} />
                {showPreview === template.id ? 'Hide' : 'Show'} Sample Data
              </button>
            </div>

            {/* Sample Data Preview */}
            {showPreview === template.id && (
              <div style={{
                marginBottom: '15px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
                  Sample Data Structure:
                </div>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#4b5563'
                }}>
                  {JSON.stringify(generateSampleData(template), null, 2)}
                </pre>
              </div>
            )}

            {/* Annotation Preview */}
            {selectedTemplate === template.id && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <strong style={{ fontSize: '14px', color: '#1e40af' }}>Annotation Instructions:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#3730a3' }}>
                  {template.annotation_schema.instructions}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTemplateSelect(template)
                }}
                style={{
                  flex: 1,
                  backgroundColor: selectedTemplate === template.id ? '#1d4ed8' : '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
              </button>
            </div>
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
            minHeight: '250px',
            background: '#fafafa'
          }}
        >
          <Plus size={48} color="#9ca3af" />
          <h3 style={{ marginTop: '15px', color: '#4b5563' }}>Create Custom Template</h3>
          <p style={{ textAlign: 'center', color: '#6b7280', margin: '8px 0' }}>
            Design your own dataset structure with custom fields and annotation schema
          </p>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            background: '#f3f4f6',
            padding: '4px 8px',
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            Advanced • Flexible • Customizable
          </div>
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
              minHeight: '250px',
              background: '#f9fafb'
            }}
          >
            <Settings size={48} color="#6b7280" />
            <h3 style={{ marginTop: '15px', color: '#4b5563' }}>Manage Templates</h3>
            <p style={{ textAlign: 'center', color: '#6b7280' }}>
              Edit and delete your saved custom templates
            </p>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              background: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '4px',
              marginTop: '8px'
            }}>
              {templates.filter(t => t.task_type === 'custom').length} custom templates
            </div>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              const template = templates.find(t => t.id === selectedTemplate)
              if (template) onTemplateSelected(template)
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Use Selected Template →
          </button>
        </div>
      )}
    </div>
  )
}

export default DatasetTemplateSelector