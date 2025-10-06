import { useEffect, useState } from 'react';
import { Database, RefreshCw, Zap, CheckCircle, XCircle, Clock, FileText, Trash2 } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  format: string;
  row_count: number;
  filename: string;
}

interface IndexedDataset {
  datasetId: string;
  datasetName: string;
  documentCount: number;
  category: string;
}

interface IndexedDatasetsResponse {
  indexed_datasets: IndexedDataset[];
  total_indexed_datasets: number;
  total_documents: number;
  last_updated: string | null;
}

export default function RAGIndexing() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [indexedDatasets, setIndexedDatasets] = useState<IndexedDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_documents: number; total_indexed_datasets: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'indexed'>('available');
  
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  const apiPrefix = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiPrefix}/rag/available-datasets`);
      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch (e) {
      console.warn('Failed to load datasets', e);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadIndexedDatasets = async () => {
    try {
      const res = await fetch(`${apiPrefix}/rag/indexed-datasets`);
      const data: IndexedDatasetsResponse = await res.json();
      setIndexedDatasets(data.indexed_datasets || []);
      setStats({
        total_documents: data.total_documents,
        total_indexed_datasets: data.total_indexed_datasets
      });
    } catch (e) {
      console.warn('Failed to load indexed datasets', e);
      setIndexedDatasets([]);
    }
  };

  useEffect(() => { 
    loadDatasets();
    loadIndexedDatasets();
  }, []);

  const indexFile = async (fileId: string, datasetName: string) => {
    setIndexing(fileId);
    try {
      const res = await fetch(`${apiPrefix}/rag/index-dataset-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, dataset_name: datasetName })
      });
      const data = await res.json();
      alert(`✓ Successfully indexed!\n\n${data.indexed_documents || 0} documents indexed\nDataset: ${data.dataset_name || datasetName}`);
      await loadDatasets();
      await loadIndexedDatasets();
    } catch (e) {
      alert('Indexing failed: ' + String(e));
    } finally {
      setIndexing(null);
    }
  };

  const bulkIndex = async () => {
    setIndexing('bulk');
    try {
      const res = await fetch(`${apiPrefix}/rag/index-dataset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_name: 'ebook_dataset' })
      });
      const data = await res.json();
      alert(`✓ Bulk indexed!\n\n${data.total_documents_indexed || 0} documents indexed from ${data.total_files_processed || 0} files`);
      await loadDatasets();
      await loadIndexedDatasets();
    } catch (e) {
      alert('Bulk indexing failed: ' + String(e));
    } finally {
      setIndexing(null);
    }
  };

  const removeDataset = async (datasetId: string) => {
    if (!confirm(`Remove dataset ${datasetId} from RAG index?`)) return;
    
    try {
      const res = await fetch(`${apiPrefix}/rag/remove-dataset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId })
      });
      const data = await res.json();
      alert(`✓ ${data.message || 'Removed successfully'}`);
      await loadIndexedDatasets();
    } catch (e) {
      alert('Failed to remove dataset: ' + String(e));
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Database size={32} color="#1e40af" style={{ marginRight: '12px' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>RAG Indexing</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              Index exported datasets into RAG for semantic search
            </p>
          </div>
        </div>

        {stats && (
          <div style={{ 
            display: 'flex',
            gap: '16px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Total Documents
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>
                {stats.total_documents}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Indexed Datasets
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                {stats.total_indexed_datasets}
              </div>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'available' ? '3px solid #1e40af' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'available' ? 600 : 400,
              color: activeTab === 'available' ? '#1e40af' : '#64748b',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Available Datasets ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab('indexed')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'indexed' ? '3px solid #1e40af' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'indexed' ? 600 : 400,
              color: activeTab === 'indexed' ? '#1e40af' : '#64748b',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Indexed Datasets ({indexedDatasets.length})
          </button>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              loadDatasets();
              loadIndexedDatasets();
            }} 
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#334155'
            }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {activeTab === 'available' && (
            <button 
              onClick={bulkIndex} 
              disabled={indexing === 'bulk'}
              style={{
                padding: '10px 20px',
                background: indexing === 'bulk' ? '#94a3b8' : '#7c3aed',
                border: 'none',
                borderRadius: '8px',
                cursor: indexing === 'bulk' ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white'
              }}
            >
              <Zap size={18} />
              {indexing === 'bulk' ? 'Indexing...' : 'Bulk Index All Parsed Docs'}
            </button>
          )}
        </div>

        {activeTab === 'available' && (
          <div>
            {datasets.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {datasets.map(ds => (
                  <div 
                    key={ds.id}
                    style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      background: 'white',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <FileText size={20} color="#1e40af" />
                          <strong style={{ fontSize: '16px', color: '#1e293b' }}>{ds.name}</strong>
                          <span style={{ 
                            padding: '2px 8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {ds.format.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          {ds.row_count} rows • {ds.filename}
                        </div>
                      </div>
                      <button 
                        onClick={() => indexFile(ds.id, ds.name)} 
                        disabled={indexing === ds.id}
                        style={{
                          padding: '10px 20px',
                          background: indexing === ds.id ? '#94a3b8' : '#1e40af',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: indexing === ds.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {indexing === ds.id ? (
                          <>
                            <Clock size={18} className="spin" />
                            Indexing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Index Dataset
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '48px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}>
                <XCircle size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
                  No exported datasets found
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Use the <strong>Sample Dataset Generator</strong> to create one
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'indexed' && (
          <div>
            {indexedDatasets.length ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {indexedDatasets.map(ds => (
                  <div 
                    key={ds.datasetId}
                    style={{ 
                      border: '1px solid #dcfce7',
                      borderRadius: '8px',
                      padding: '16px',
                      background: '#f0fdf4',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <CheckCircle size={20} color="#059669" />
                          <strong style={{ fontSize: '16px', color: '#1e293b' }}>{ds.datasetName}</strong>
                          <span style={{ 
                            padding: '2px 8px',
                            background: '#dcfce7',
                            color: '#059669',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            INDEXED
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          {ds.documentCount} documents • Category: {ds.category}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Dataset ID: {ds.datasetId}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeDataset(ds.datasetId)}
                        style={{
                          padding: '10px 20px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Trash2 size={18} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '48px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}>
                <Database size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
                  No datasets indexed yet
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Switch to <strong>Available Datasets</strong> tab to index some datasets
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
