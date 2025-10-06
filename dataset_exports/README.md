Sample dataset for RAG indexing

Files:
- `sample_dataset_small.csv` - A tiny CSV with three rows suitable for local testing.
- `sample_dataset_small_index_meta.json` - Metadata describing the dataset.

How to index locally:
1. Ensure backend is running (default: http://localhost:8000). If your backend is on a different host/port, set the environment variable DATAFORGE_BACKEND.

2. Install requests (if not installed):

```bash
pip install requests
```

3. Run the provided script from the repository root:

```bash
python3 scripts/index_sample_dataset.py
```

4. Check backend logs or `/api/rag/stats` to confirm the dataset was indexed.

If your backend expects a different field name or auth, update `scripts/index_sample_dataset.py` accordingly.
