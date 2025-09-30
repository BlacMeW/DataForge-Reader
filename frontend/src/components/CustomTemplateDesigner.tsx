import React, { useState } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import axios from 'axios'

interface CustomField {
  name: string
  type: 'string' | 'integer' | 'float' | 'boolean' | 'categorical' | 'list'
  description: string
  options?: string[]
  optional?: boolean
}

interface DatasetTemplate {
  id: string
  name: string
  description: string
  fields: CustomField[]
  annotation_schema: {
    type: string
    options?: string[]
    instructions: string
  }
}

interface CustomTemplateDesignerProps {
  onTemplateCreated: (template: DatasetTemplate) => void
  onBack: () => void
}

const API_BASE_URL = 'http://localhost:8000/api'

const CustomTemplateDesigner: React.FC<CustomTemplateDesignerProps> = ({ 
  onTemplateCreated, 
  onBack 
}) => {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [fields, setFields] = useState<CustomField[]>([
    { name: 'text', type: 'string', description: 'Input text', optional: false }
  ])
  const [annotationType, setAnnotationType] = useState<'single_choice' | 'multi_choice' | 'text_input' | 'span_selection'>('single_choice')
  const [annotationOptions, setAnnotationOptions] = useState<string[]>([''])
  const [annotationInstructions, setAnnotationInstructions] = useState('')

  const addField = () => {
    setFields([...fields, { 
      name: '', 
      type: 'string', 
      description: '', 
      optional: false 
    }])
  }

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index))
    }
  }

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const addAnnotationOption = () => {
    setAnnotationOptions([...annotationOptions, ''])
  }

  const updateAnnotationOption = (index: number, value: string) => {
    const newOptions = [...annotationOptions]
    newOptions[index] = value
    setAnnotationOptions(newOptions)
  }

  const removeAnnotationOption = (index: number) => {
    if (annotationOptions.length > 1) {
      setAnnotationOptions(annotationOptions.filter((_, i) => i !== index))
    }
  }

  const createTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    const template = {
      name: templateName,
      description: templateDescription,
      fields: fields.filter(f => f.name.trim()),
      annotation_schema: {
        type: annotationType,
        options: annotationOptions.filter(opt => opt.trim()),
        instructions: annotationInstructions
      }
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/templates/custom`, template)
      onTemplateCreated(response.data.template)
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template')
    }
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
        <h2>Custom Dataset Designer</h2>
        <p>Create your own dataset template with custom fields and annotation schema</p>
      </div>

      <div className="file-info" style={{ marginBottom: '30px' }}>
        <h3>Template Information</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Template Name *
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Document Classification"
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
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Describe what this dataset template is for..."
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

      <div className="file-info" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Dataset Fields</h3>
          <button onClick={addField} style={{ display: 'flex', alignItems: 'center' }}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add Field
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={index} style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '6px', 
            padding: '15px', 
            marginBottom: '15px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Field {index + 1}</span>
              {fields.length > 1 && (
                <button 
                  onClick={() => removeField(index)}
                  style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Field Name
                </label>
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  placeholder="field_name"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px' 
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Type
                </label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value as CustomField['type'] })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="string">Text</option>
                  <option value="integer">Integer</option>
                  <option value="float">Float</option>
                  <option value="boolean">Boolean</option>
                  <option value="categorical">Categorical</option>
                  <option value="list">List</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                Description
              </label>
              <input
                type="text"
                value={field.description}
                onChange={(e) => updateField(index, { description: e.target.value })}
                placeholder="What this field represents..."
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px' 
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={field.optional || false}
                onChange={(e) => updateField(index, { optional: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Optional field
            </label>
          </div>
        ))}
      </div>

      <div className="file-info" style={{ marginBottom: '30px' }}>
        <h3>Annotation Schema</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Annotation Type
          </label>
          <select
            value={annotationType}
            onChange={(e) => setAnnotationType(e.target.value as 'single_choice' | 'multi_choice' | 'text_input' | 'span_selection')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px' 
            }}
          >
            <option value="single_choice">Single Choice</option>
            <option value="multi_choice">Multiple Choice</option>
            <option value="text_input">Text Input</option>
            <option value="span_selection">Text Span Selection</option>
          </select>
        </div>

        {(annotationType === 'single_choice' || annotationType === 'multi_choice') && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Annotation Options</label>
              <button onClick={addAnnotationOption} style={{ fontSize: '14px' }}>
                <Plus size={14} style={{ marginRight: '4px' }} />
                Add Option
              </button>
            </div>
            
            {annotationOptions.map((option, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateAnnotationOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px',
                    marginRight: '10px'
                  }}
                />
                {annotationOptions.length > 1 && (
                  <button 
                    onClick={() => removeAnnotationOption(index)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Instructions for Annotators
          </label>
          <textarea
            value={annotationInstructions}
            onChange={(e) => setAnnotationInstructions(e.target.value)}
            placeholder="Provide clear instructions on how to annotate the data..."
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
          onClick={createTemplate}
          style={{ 
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Create Custom Template
        </button>
      </div>
    </div>
  )
}

export default CustomTemplateDesigner