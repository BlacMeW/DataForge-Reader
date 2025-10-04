import React, { useState, useEffect } from 'react'
import { Edit, Trash2, ArrowLeft, Plus } from 'lucide-react'
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

interface CustomTemplateManagerProps {
  onTemplateSelected: (template: DatasetTemplate) => void
  onCreateNew: () => void
  onBack: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = ({
  onTemplateSelected,
  onCreateNew,
  onBack
}) => {
  const [templates, setTemplates] = useState<DatasetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<DatasetTemplate | null>(null)

  useEffect(() => {
    loadCustomTemplates()
  }, [])

  const loadCustomTemplates = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/dataset/templates/custom`)
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Failed to load custom templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this custom template? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/dataset/templates/custom/${templateId}`)
      setTemplates(templates.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const handleEditTemplate = (template: DatasetTemplate) => {
    setEditingTemplate(template)
  }

  const handleSaveEdit = async () => {
    if (!editingTemplate) return

    try {
      const response = await axios.put(`${API_BASE_URL}/dataset/templates/custom/${editingTemplate.id}`, {
        name: editingTemplate.name,
        description: editingTemplate.description,
        fields: editingTemplate.fields,
        annotation_schema: editingTemplate.annotation_schema
      })
      setTemplates(templates.map(t => t.id === editingTemplate.id ? response.data.template : t))
      setEditingTemplate(null)
    } catch (error) {
      console.error('Failed to update template:', error)
      alert('Failed to update template')
    }
  }

  const updateEditingTemplate = (updates: Partial<DatasetTemplate>) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, ...updates })
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading custom templates...</p>
        </div>
      </div>
    )
  }

  if (editingTemplate) {
    return (
      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setEditingTemplate(null)} style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Templates
          </button>
        </div>

        <div className="header">
          <h2>Edit Custom Template</h2>
          <p>Modify your custom dataset template</p>
        </div>

        <div className="file-info" style={{ marginBottom: '30px' }}>
          <h3>Template Information</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Template Name *
            </label>
            <input
              type="text"
              value={editingTemplate.name}
              onChange={(e) => updateEditingTemplate({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Description
            </label>
            <textarea
              value={editingTemplate.description}
              onChange={(e) => updateEditingTemplate({ description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSaveEdit}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            Save Changes
          </button>
          <button
            onClick={() => setEditingTemplate(null)}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Templates
        </button>
      </div>

      <div className="header">
        <h2>Manage Custom Templates</h2>
        <p>View, edit, and delete your saved custom dataset templates</p>
      </div>

      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <button
          onClick={onCreateNew}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          Create New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            You haven't created any custom templates yet.
          </p>
          <button
            onClick={onCreateNew}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              className="file-info"
              style={{
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => handleEditTemplate(template)}
                  style={{
                    background: '#fef3c7',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer'
                  }}
                  title="Edit template"
                >
                  <Edit size={16} color="#92400e" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer'
                  }}
                  title="Delete template"
                >
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>

              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{template.name}</h3>

              <p style={{ color: '#4b5563', marginBottom: '15px', fontSize: '14px' }}>
                {template.description || 'No description provided'}
              </p>

              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                <strong>Fields:</strong> {template.fields.length}
                <br />
                <strong>Annotation:</strong> {template.annotation_schema.type.replace('_', ' ')}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => onTemplateSelected(template)}
                  style={{
                    flex: 1,
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomTemplateManager