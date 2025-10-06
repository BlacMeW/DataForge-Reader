# RAG Index Storage

This directory stores the RAG (Retrieval-Augmented Generation) index file.

## Files

- `rag_index.json` - Main RAG index containing:
  - Indexed documents
  - Vector embeddings
  - Dataset metadata
  - Statistics

## Important Notes

⚠️ **This file is NOT tracked in Git** because:
- It can be very large (100+ MB)
- It's generated from user data
- It can be recreated by re-indexing datasets

## Recreating the Index

If the index file is missing, you can recreate it by:

1. Go to **RAG Indexing** page
2. Click **"Bulk Index All Parsed Docs"** or
3. Index individual datasets from the **"Available Datasets"** tab

## File Location

```
storage/
└── rag/
    ├── .gitkeep          (tracked - preserves directory)
    ├── README.md         (tracked - documentation)
    └── rag_index.json    (NOT tracked - user data)
```

## Backup Recommendation

If you want to preserve your RAG index:
- Copy `rag_index.json` to a backup location
- Use external storage or cloud backup
- Do NOT commit to Git (too large)
