import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  BarChart3,
  FileText,
  Sparkles,
  TrendingUp,
  Download,
  Upload,
  Target,
  Zap,
  X,
  Wand2
} from 'lucide-react'
import type { ParsedParagraph } from '../App'
import DataAnalytics from './DataAnalytics'
import DataMining from './DataMining'
import AnalyticsDashboard from './AnalyticsDashboard'

interface DataAnalysisWizardProps {
  paragraphs: ParsedParagraph[]
  filename: string
  onClose: () => void
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
  completed: boolean
  skippable: boolean
}

const DataAnalysisWizard: React.FC<DataAnalysisWizardProps> = ({
  paragraphs,
  filename,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Processing info
  const processingInfo = {
    totalPages: Math.max(...paragraphs.map(p => p.page), 0),
    extractionMethod: 'PDF Text Extraction',
    processingTime: 2.5
  }

  const steps: WizardStep[] = [
    {
      id: 'data-selection',
      title: 'Data Selection',
      description: 'Review and validate your uploaded data',
      icon: <Upload className="w-5 h-5" />,
      component: paragraphs.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">No Data Available</h3>
            <p className="text-yellow-700 mb-4">
              You need to upload and parse a document first before you can use the Data Analysis Wizard.
            </p>
            <button
              onClick={onClose}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Go Back to Upload
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Data Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{paragraphs.length}</div>
                <div className="text-sm text-blue-700">Paragraphs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{processingInfo.totalPages}</div>
                <div className="text-sm text-blue-700">Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {paragraphs.reduce((sum, p) => sum + p.word_count, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {paragraphs.reduce((sum, p) => sum + p.char_count, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Total Characters</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Data Preview</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {paragraphs.slice(0, 5).map((paragraph) => (
                <div key={paragraph.id} className="bg-white border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Page {paragraph.page}, Paragraph {paragraph.paragraph_index}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {paragraph.text}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {paragraph.word_count} words, {paragraph.char_count} chars
                  </div>
                </div>
              ))}
            </div>
            {paragraphs.length > 5 && (
              <div className="text-sm text-gray-500 mt-3 text-center">
                ... and {paragraphs.length - 5} more paragraphs
              </div>
            )}
          </div>
        </div>
      ),
      completed: true,
      skippable: false
    },
    {
      id: 'basic-analytics',
      title: 'Basic Analytics',
      description: 'Explore basic statistics and distributions',
      icon: <BarChart3 className="w-5 h-5" />,
      component: (
        <DataAnalytics
          paragraphs={paragraphs}
          filename={filename}
          processingInfo={processingInfo}
        />
      ),
      completed: completedSteps.has(1),
      skippable: false
    },
    {
      id: 'nlp-analysis',
      title: 'NLP Analysis',
      description: 'Extract entities, keywords, and sentiment',
      icon: <Sparkles className="w-5 h-5" />,
      component: (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">NLP Analysis</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This step performs advanced natural language processing to extract insights from your text data.
                  You can analyze entities, keywords, and sentiment patterns.
                </p>
              </div>
            </div>
          </div>
          <DataMining
            paragraphs={paragraphs}
            onClose={() => {}} // Handled by wizard
          />
        </div>
      ),
      completed: completedSteps.has(2),
      skippable: true
    },
    {
      id: 'advanced-dashboard',
      title: 'Advanced Dashboard',
      description: 'Comprehensive insights and visualizations',
      icon: <TrendingUp className="w-5 h-5" />,
      component: (
        <AnalyticsDashboard
          paragraphs={paragraphs}
          filename={filename}
          processingInfo={processingInfo}
          keywords={[]} // Will be populated from NLP analysis
          entities={[]} // Will be populated from NLP analysis
        />
      ),
      completed: completedSteps.has(3),
      skippable: false
    },
    {
      id: 'export-results',
      title: 'Export Results',
      description: 'Generate reports and export your analysis',
      icon: <Download className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Analysis Complete!</h3>
            <p className="text-green-700 mb-4">
              Your data analysis is complete. You can now export your results in various formats.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                <FileText className="w-5 h-5" />
                <span>Export PDF Report</span>
              </button>

              <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-5 h-5" />
                <span>Export CSV Data</span>
              </button>

              <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span>Export Charts</span>
              </button>

              <button className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                <Zap className="w-5 h-5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Data Processed:</span>
                <span className="font-medium">{paragraphs.length} paragraphs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Analysis Steps Completed:</span>
                <span className="font-medium">{completedSteps.size + 1} / 5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing Time:</span>
                <span className="font-medium">{processingInfo.processingTime}s</span>
              </div>
            </div>
          </div>
        </div>
      ),
      completed: completedSteps.has(4),
      skippable: false
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow jumping to completed steps or next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex)
    }
  }

  const canProceed = () => {
    const currentStepData = steps[currentStep]
    // Can't proceed if no data is available
    if (paragraphs.length === 0 && currentStep > 0) {
      return false
    }
    return !currentStepData.skippable || completedSteps.has(currentStep)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wand2 size={28} color="#8b5cf6" />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Data Analysis Wizard</h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                Step-by-step data analysis for {filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '16px 24px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleStepClick(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: index === currentStep
                      ? '#e0e7ff'
                      : index < currentStep || completedSteps.has(index)
                      ? '#d1fae5'
                      : '#f3f4f6',
                    color: index === currentStep
                      ? '#1e40af'
                      : index < currentStep || completedSteps.has(index)
                      ? '#065f46'
                      : '#6b7280',
                    cursor: index > currentStep && !completedSteps.has(index - 1) ? 'not-allowed' : 'pointer',
                    opacity: index > currentStep && !completedSteps.has(index - 1) ? 0.5 : 1
                  }}
                  disabled={index > currentStep && !completedSteps.has(index - 1)}
                >
                  {index < currentStep || completedSteps.has(index) ? (
                    <Check size={16} />
                  ) : (
                    step.icon
                  )}
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight size={16} color="#d1d5db" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#111827' }}>
              {steps[currentStep].title}
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {steps[currentStep].description}
            </p>
          </div>

          <div style={{ minHeight: '400px' }}>
            {steps[currentStep].component}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Step {currentStep + 1} of {steps.length}
          </div>

          <button
            onClick={currentStep === steps.length - 1 ? onClose : handleNext}
            disabled={!canProceed()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: !canProceed() ? 'not-allowed' : 'pointer',
              opacity: !canProceed() ? 0.5 : 1
            }}
          >
            <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
            {currentStep < steps.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataAnalysisWizard