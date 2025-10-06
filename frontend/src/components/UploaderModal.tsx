import { useState, useRef, useEffect } from 'react';
import { X, UploadCloud } from 'lucide-react';

export default function UploaderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [contextResult, setContextResult] = useState<string | null>(null);
  const [interactiveQuery, setInteractiveQuery] = useState<string>('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  // If the API base already includes the /api prefix, don't add it again.
  const apiPrefix = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const handleUpload = async () => {
    if (!file) return alert('Select a file first');
    setStatus('Uploading...');
    const form = new FormData();
    form.append('file', file, file.name);
    
    // Use the file name (without extension) as the dataset identifier
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const datasetId = `ds_${fileNameWithoutExt}_${Date.now()}`;
    const datasetName = fileNameWithoutExt || 'Uploaded Dataset';
    
    form.append('dataset_id', datasetId);
    form.append('dataset_name', datasetName);

    try {
      // Step 1: upload file to upload endpoint to get a file_id
  const uploadResp = await fetch(`${apiPrefix}/upload`, { method: 'POST', body: form });
      if (!uploadResp.ok) throw new Error(`${uploadResp.status} ${uploadResp.statusText}`);
      const uploadBody = await uploadResp.json().catch(() => null);
      const fileId = uploadBody?.file_id;
      if (!fileId) throw new Error('Upload did not return file_id');

      setStatus(`Upload succeeded: file_id=${fileId}`);

      // Step 2: tell RAG service to index that uploaded file by file_id
  const indexResp = await fetch(`${apiPrefix}/rag/index-dataset-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, dataset_name: datasetName })
      });
      if (!indexResp.ok) {
        const errText = await indexResp.text().catch(() => '');
        throw new Error(`Indexing failed: ${indexResp.status} ${indexResp.statusText} ${errText}`);
      }

      const body = await indexResp.json().catch(() => null);
      setStatus(`Indexing started${body ? ': ' + JSON.stringify(body) : ''}`);

      // Start polling for indexing progress
      setStatus((s) => (s ? s + ' — waiting for indexing...' : 'Waiting for indexing...'));
      const start = Date.now();
      const timeoutMs = 60 * 1000; // 60s
      let indexed = false;
      while (Date.now() - start < timeoutMs) {
        try {
          const statsResp = await fetch(`${apiPrefix}/rag/stats`);
          if (statsResp.ok) {
            const statsBody = await statsResp.json().catch(() => null);
            const stats = statsBody?.stats || statsBody;
            // If the backend reports any documents, consider indexing done
            const total = typeof stats === 'object' ? stats.total_documents || stats.total || 0 : 0;
            setStatus(`Indexing: ${total} documents indexed`);
            if (total && total > 0) {
              indexed = true;
              break;
            }
          }
        } catch {
          // ignore transient errors
        }
        // wait before next poll
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!indexed) {
        setStatus('Indexing did not complete within 60s. You can re-run checks using the provided Python script.');
        return;
      }

  setStatus('Indexing complete — running queries...');
      // Run a search and context to show results
      if (!interactiveQuery.trim()) {
        setStatus('Indexing complete! Enter a query to search.');
        return;
      }
      
      try {
  const searchResp = await fetch(`${apiPrefix}/rag/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: interactiveQuery, topK: 5, threshold: 0.1, searchIn: 'fullText' })
        });
        const searchJson = searchResp.ok ? await searchResp.json().catch(() => null) : { error: `${searchResp.status} ${searchResp.statusText}` };

  const ctxResp = await fetch(`${apiPrefix}/rag/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: interactiveQuery, topK: 5, threshold: 0.1, searchIn: 'fullText' })
        });
        const ctxJson = ctxResp.ok ? await ctxResp.json().catch(() => null) : { error: `${ctxResp.status} ${ctxResp.statusText}` };

        setSearchResult(JSON.stringify(searchJson, null, 2));
        setContextResult(JSON.stringify(ctxJson, null, 2));
        setStatus('Queries completed');
      } catch (err) {
        setStatus('Queries failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    } catch (err) {
      setStatus('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close when clicking on the overlay (but not when clicking inside the modal)
        if (e.currentTarget === e.target) onClose();
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: 'white', width: '640px', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #eee', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <UploadCloud />
            <div>
              <div style={{ fontWeight: 700 }}>Upload dataset (test)</div>
              <div style={{ fontSize: 12, color: '#666' }}>No auth required — for local testing only</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload dialog"
            title="Close"
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <X />
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <input ref={inputRef} type="file" accept=".csv,.tsv,text/csv,application/csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={handleUpload} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>Upload</button>
            <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} style={{ padding: '8px 12px', borderRadius: 6 }}>Clear</button>
          </div>
          {status && <div style={{ marginTop: 12, fontSize: 13, color: '#333' }}>{status}</div>}
          {searchResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>Search Result</div>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', background: '#f3f4f6', padding: 8, borderRadius: 6 }}>{searchResult}</pre>
            </div>
          )}
          {contextResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>Context Result</div>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', background: '#f3f4f6', padding: 8, borderRadius: 6 }}>{contextResult}</pre>
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            Tip: Use the sample file <code>dataset_exports/sample_dataset_small.csv</code> for quick tests.
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Run interactive queries</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={interactiveQuery} onChange={(e) => setInteractiveQuery(e.target.value)} placeholder="Enter query..." style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #e6e7eb' }} />
              <button onClick={async () => {
                setStatus('Running interactive search...');
                try {
                  const resp = await fetch(`${apiPrefix}/rag/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: interactiveQuery, topK: 5, threshold: 0.1, searchIn: 'fullText' }) });
                  const json = resp.ok ? await resp.json().catch(() => null) : { error: `${resp.status} ${resp.statusText}` };
                  setSearchResult(JSON.stringify(json, null, 2));
                  setStatus('Interactive search completed');
                } catch {
                  setStatus('Interactive search failed');
                }
              }} style={{ padding: '8px 12px', borderRadius: 6, background: '#7c3aed', color: 'white', border: 'none' }}>Run Search</button>
              <button onClick={async () => {
                setStatus('Running interactive context...');
                try {
                  const resp = await fetch(`${apiPrefix}/rag/context`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: interactiveQuery, topK: 5, threshold: 0.1, searchIn: 'fullText' }) });
                  const json = resp.ok ? await resp.json().catch(() => null) : { error: `${resp.status} ${resp.statusText}` };
                  setContextResult(JSON.stringify(json, null, 2));
                  setStatus('Interactive context completed');
                } catch {
                  setStatus('Interactive context failed');
                }
              }} style={{ padding: '8px 12px', borderRadius: 6 }}>Run Context</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
