import { useState } from 'react';
import { FileText, Download, Upload, Sparkles, AlertCircle } from 'lucide-react';

type DatasetTemplate = 'qa' | 'document' | 'conversation' | 'custom';

interface TemplateConfig {
  name: string;
  description: string;
  fields: string[];
}

const templates: Record<DatasetTemplate, TemplateConfig> = {
  qa: {
    name: 'Question & Answer',
    description: 'Question-answer pairs for training or testing',
    fields: ['id', 'question', 'answer', 'category', 'difficulty']
  },
  document: {
    name: 'Document Snippets',
    description: 'Text documents with metadata',
    fields: ['id', 'title', 'content', 'author', 'page', 'category']
  },
  conversation: {
    name: 'Conversation',
    description: 'Dialogue exchanges between multiple speakers',
    fields: ['id', 'speaker', 'message', 'timestamp', 'context']
  },
  custom: {
    name: 'Custom Format',
    description: 'Define your own fields',
    fields: ['id', 'field1', 'field2', 'field3']
  }
};

export default function SampleDatasetGenerator() {
  const [rows, setRows] = useState<number>(10);
  const [template, setTemplate] = useState<DatasetTemplate>('document');
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  const apiPrefix = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const generateQAData = (n: number): string[][] => {
    const questions = [
      'What is machine learning?',
      'How does natural language processing work?',
      'What are neural networks?',
      'Explain deep learning',
      'What is transfer learning?',
      'How do transformers work?',
      'What is supervised learning?',
      'What is unsupervised learning?',
      'Explain reinforcement learning',
      'What are embeddings?'
    ];
    const categories = ['ML Basics', 'NLP', 'Deep Learning', 'Architecture', 'Training'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    
    const rows: string[][] = [];
    for (let i = 0; i < n; i++) {
      const q = questions[i % questions.length];
      rows.push([
        `qa_${Date.now()}_${i}`,
        q,
        `This is a detailed answer to: "${q}". It explains the concept thoroughly with examples.`,
        categories[i % categories.length],
        difficulties[i % difficulties.length]
      ]);
    }
    return rows;
  };

  const generateDocumentData = (n: number): string[][] => {
    const titles = [
      'Introduction to AI', 'Data Science Fundamentals', 'Machine Learning Basics',
      'Deep Learning Architecture', 'Natural Language Processing', 'Computer Vision',
      'Reinforcement Learning', 'Transfer Learning', 'Model Optimization', 'AI Ethics'
    ];
    const authors = ['Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown'];
    const categories = ['AI', 'ML', 'Data Science', 'Computer Science'];
    
    const rows: string[][] = [];
    for (let i = 0; i < n; i++) {
      rows.push([
        `doc_${Date.now()}_${i}`,
        titles[i % titles.length],
        `This is paragraph ${i + 1} of the document. It contains detailed information about ${titles[i % titles.length].toLowerCase()}. The content is comprehensive and covers multiple aspects of the topic with real-world examples and use cases.`,
        authors[i % authors.length],
        `${Math.floor(i / 3) + 1}`,
        categories[i % categories.length]
      ]);
    }
    return rows;
  };

  const generateConversationData = (n: number): string[][] => {
    const speakers = ['User', 'Assistant', 'Expert', 'Student'];
    const contexts = ['Technical Discussion', 'Tutorial', 'Q&A Session', 'Review'];
    
    const rows: string[][] = [];
    for (let i = 0; i < n; i++) {
      const speaker = speakers[i % speakers.length];
      const isQuestion = i % 2 === 0;
      rows.push([
        `conv_${Date.now()}_${i}`,
        speaker,
        isQuestion 
          ? `Can you explain more about topic ${Math.floor(i / 2) + 1}?`
          : `Sure! Topic ${Math.floor(i / 2) + 1} is about... Let me explain in detail.`,
        new Date(Date.now() - (n - i) * 60000).toISOString(),
        contexts[Math.floor(i / 4) % contexts.length]
      ]);
    }
    return rows;
  };

  const generateCustomData = (n: number): string[][] => {
    const rows: string[][] = [];
    for (let i = 0; i < n; i++) {
      rows.push([
        `custom_${Date.now()}_${i}`,
        `Value1_${i}`,
        `Value2_${i}`,
        `Value3_${i}`
      ]);
    }
    return rows;
  };

  const generateCsv = (n: number, templateType: DatasetTemplate): string => {
    const config = templates[templateType];
    const headers = config.fields;
    
    let dataRows: string[][] = [];
    switch (templateType) {
      case 'qa':
        dataRows = generateQAData(n);
        break;
      case 'document':
        dataRows = generateDocumentData(n);
        break;
      case 'conversation':
        dataRows = generateConversationData(n);
        break;
      case 'custom':
        dataRows = generateCustomData(n);
        break;
    }
    
    const lines = [headers.join(',')];
    dataRows.forEach(row => {
      const escapedRow = row.map(field => JSON.stringify(field));
      lines.push(escapedRow.join(','));
    });
    
    return lines.join('\n');
  };

  const handlePreview = () => {
    const csv = generateCsv(Math.min(rows, 5), template);
    setCsvPreview(csv);
    setShowPreview(true);
  };

  const handleDownload = () => {
    const csv = generateCsv(rows, template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${template}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateAndUpload = async () => {
    setUploading(true);
    setFileId(null);
    try {
      const csv = generateCsv(rows, template);
      const blob = new Blob([csv], { type: 'text/csv' });
      const form = new FormData();
      form.append('file', new File([blob], `sample_${template}_${Date.now()}.csv`, { type: 'text/csv' }));

      const res = await fetch(`${apiPrefix}/upload`, {
        method: 'POST',
        body: form
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFileId(data.file_id || data.fileId || null);
    } catch (e: unknown) {
      alert('Upload failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Sparkles size={32} color="#1e40af" style={{ marginRight: '12px' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>Sample Dataset Generator</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              Create sample datasets for testing RAG indexing and querying
            </p>
          </div>
        </div>

        {/* Template Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: '12px',
            color: '#334155'
          }}>
            Select Template
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(templates).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setTemplate(key as DatasetTemplate)}
                style={{
                  padding: '16px',
                  border: template === key ? '2px solid #1e40af' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: template === key ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                  {config.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {config.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fields Preview */}
        <div style={{ 
          marginBottom: '24px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
            Fields: {templates[template].fields.join(', ')}
          </div>
        </div>

        {/* Row Count */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: '8px',
            color: '#334155'
          }}>
            Number of Rows: {rows}
          </label>
          <input 
            type="range"
            min={1} 
            max={500} 
            value={rows} 
            onChange={(e) => setRows(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>1</span>
            <span>500</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePreview}
            style={{
              padding: '12px 24px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#334155'
            }}
          >
            <FileText size={18} />
            Preview (5 rows)
          </button>
          
          <button 
            onClick={handleDownload}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white'
            }}
          >
            <Download size={18} />
            Download CSV
          </button>

          <button 
            onClick={handleCreateAndUpload}
            disabled={uploading}
            style={{
              padding: '12px 24px',
              background: uploading ? '#94a3b8' : '#1e40af',
              border: 'none',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white'
            }}
          >
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Create & Upload'}
          </button>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '12px', color: '#334155' }}>
              CSV Preview (first 5 rows):
            </div>
            <pre style={{ 
              background: '#1e293b',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '12px',
              margin: 0
            }}>
              {csvPreview}
            </pre>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#64748b',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              Hide Preview
            </button>
          </div>
        )}

        {/* Success Message */}
        {fileId && (
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle size={20} color="#15803d" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>
                  ✓ Upload Successful!
                </div>
                <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>
                  File ID: <strong>{fileId}</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#166534' }}>
                  Next step: Go to <strong>RAG Indexing</strong> page to index this dataset into RAG.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
