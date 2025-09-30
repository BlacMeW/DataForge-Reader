import React, { useState, useEffect } from 'react'
import { Folder, Plus, File, Trash2, Calendar, FileText } from 'lucide-react'
import type { UploadedFile } from '../App'

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  files: UploadedFile[]
}

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void
  onFileSelect: (file: UploadedFile) => void
  currentProject?: Project
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  onProjectSelect, 
  onFileSelect,
  currentProject 
}) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(currentProject || null)

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('dataforge-projects')
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects)
        setProjects(parsedProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
  }, [])

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('dataforge-projects', JSON.stringify(projects))
  }, [projects])

  const createProject = () => {
    if (!newProjectName.trim()) return

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: []
    }

    setProjects([...projects, newProject])
    setNewProjectName('')
    setNewProjectDescription('')
    setShowCreateForm(false)
  }

  const deleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? All associated files will be removed.')) {
      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
    }
  }

  const selectProject = (project: Project) => {
    setSelectedProject(project)
    onProjectSelect(project)
  }

  const removeFileFromProject = (projectId: string, fileId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, files: p.files.filter(f => f.file_id !== fileId), updatedAt: new Date().toISOString() }
        : p
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div
      onClick={() => selectProject(project)}
      style={{
        backgroundColor: selectedProject?.id === project.id ? '#eff6ff' : 'white',
        border: `2px solid ${selectedProject?.id === project.id ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '12px'
      }}
      onMouseEnter={(e) => {
        if (selectedProject?.id !== project.id) {
          e.currentTarget.style.borderColor = '#d1d5db'
        }
      }}
      onMouseLeave={(e) => {
        if (selectedProject?.id !== project.id) {
          e.currentTarget.style.borderColor = '#e5e7eb'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={20} color="#3b82f6" />
          <h4 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>{project.name}</h4>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteProject(project.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      {project.description && (
        <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.4' }}>
          {project.description}
        </p>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
          <FileText size={14} />
          <span>{project.files.length} files</span>
          <Calendar size={14} style={{ marginLeft: '8px' }} />
          <span>Updated {formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={28} color="#3b82f6" />
              Project Manager
            </h2>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Organize your documents into projects for better workflow management
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Projects List */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <Folder size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>No projects yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create your first project
                </button>
              </div>
            ) : (
              projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </div>

          {/* Project Details/Files */}
          <div>
            {selectedProject ? (
              <div>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>{selectedProject.name}</h3>
                  {selectedProject.description && (
                    <p style={{ margin: '0 0 16px 0', color: '#6b7280', lineHeight: '1.5' }}>
                      {selectedProject.description}
                    </p>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    fontSize: '14px', 
                    color: '#6b7280',
                    paddingTop: '12px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <span>Created: {formatDate(selectedProject.createdAt)}</span>
                    <span>Updated: {formatDate(selectedProject.updatedAt)}</span>
                    <span>Files: {selectedProject.files.length}</span>
                  </div>
                </div>

                {/* Project Files */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>
                    Project Files ({selectedProject.files.length})
                  </h4>
                  
                  {selectedProject.files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <File size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                      <p style={{ color: '#6b7280', margin: 0 }}>No files in this project yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedProject.files.map(file => (
                        <div
                          key={file.file_id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={() => onFileSelect(file)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} color="#6b7280" />
                            <span style={{ color: '#374151', fontWeight: '500' }}>{file.filename}</span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#9ca3af',
                              backgroundColor: '#e5e7eb',
                              padding: '2px 6px',
                              borderRadius: '10px'
                            }}>
                              {file.file_type}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFileFromProject(selectedProject.id, file.file_id)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '40px',
                textAlign: 'center'
              }}>
                <Folder size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Select a Project</h3>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Choose a project from the list to view its details and files
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Create New Project</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Description
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: newProjectName.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  cursor: newProjectName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManager
export type { Project }