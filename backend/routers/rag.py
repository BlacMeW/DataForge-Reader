from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import time
from datetime import datetime
import csv

router = APIRouter()

# Get storage directory from environment variable or use default
def get_storage_dir():
    return os.environ.get("DATAFORGE_STORAGE_DIR", "../storage")

def get_exports_dir():
    return os.environ.get("DATAFORGE_EXPORTS_DIR", "../dataset_exports")

class RAGDocument(BaseModel):
    id: str
    datasetId: str
    datasetName: str
    fullText: str
    prompt: str
    completion: str
    intent: str
    category: str
    rowIndex: int
    metadata: Dict[str, Any]

class RAGSearchRequest(BaseModel):
    query: str
    topK: Optional[int] = 5
    threshold: Optional[float] = 0.1
    datasetIds: Optional[List[str]] = None
    searchIn: Optional[str] = "fullText"

class RAGIndexRequest(BaseModel):
    file_id: str
    dataset_name: Optional[str] = None

class RAGBulkIndexRequest(BaseModel):
    dataset_name: str = "ebook_dataset"
    max_documents: Optional[int] = None

# In-memory RAG index (in production, this would be a proper vector database)
rag_index = {
    "documents": [],
    "embeddings": {},
    "indexed_datasets": set(),
    "stats": {
        "total_documents": 0,
        "indexed_datasets": 0,
        "last_updated": None
    }
}

def simple_hash(text: str) -> int:
    """Simple hash function for basic embeddings"""
    hash_val = 0
    for char in text:
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
    return abs(hash_val)

def create_simple_embedding(text: str) -> List[float]:
    """Create a simple embedding for demo purposes"""
    # In production, replace with actual embedding model
    hash_val = simple_hash(text)
    # Normalize hash_val to avoid overflow issues
    hash_val = hash_val % 1000000  # Keep it manageable
    embedding = []
    for i in range(384):  # Standard embedding dimension
        # Create a pseudo-random but deterministic value
        val = ((hash_val + i) * 0.01) % 2 - 1  # Normalize to [-1, 1]
        embedding.append(float(val))  # Ensure it's a float
    return embedding

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0

def convert_parsed_data_to_rag_documents(file_id: str, parsed_data: Dict[str, Any], dataset_name: str) -> List[Dict[str, Any]]:
    """Convert parsed paragraph data to RAG document format"""
    rag_documents = []

    for idx, paragraph in enumerate(parsed_data.get('paragraphs', [])):
        # Create RAG document
        rag_doc = {
            "id": f"{file_id}_{paragraph['id']}",
            "datasetId": file_id,
            "datasetName": dataset_name,
            "fullText": paragraph['text'],
            "prompt": paragraph['text'],
            "completion": paragraph['text'],
            "intent": "content",  # Could be enhanced with NLP
            "category": "paragraph",
            "rowIndex": idx,
            "metadata": {
                "page": paragraph.get('page', 1),
                "paragraph_index": paragraph.get('paragraph_index', idx),
                "word_count": paragraph.get('word_count', 0),
                "char_count": paragraph.get('char_count', 0),
                "annotations": paragraph.get('annotations', {}),
                "extraction_method": parsed_data.get('extraction_method', 'unknown')
            }
        }
        rag_documents.append(rag_doc)

    return rag_documents

def convert_dataset_to_rag_documents(dataset: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert dataset rows to RAG document format"""
    rag_documents = []

    for idx, row in enumerate(dataset.get('data', [])):
        # Create a comprehensive text representation from all row fields
        text_parts = []
        metadata = {
            "row_index": idx,
            "dataset_id": dataset["id"],
            "dataset_name": dataset["name"],
            "format": dataset["format"]
        }

        # Build text from all non-empty fields
        for key, value in row.items():
            if value and str(value).strip():
                text_parts.append(f"{key}: {value}")
                # Add field-specific metadata
                metadata[f"field_{key}"] = str(value)[:100]  # Truncate long values

        full_text = " | ".join(text_parts) if text_parts else f"Row {idx}"

        # Create RAG document
        rag_doc = {
            "id": f"{dataset['id']}_row_{idx}",
            "datasetId": dataset["id"],
            "datasetName": dataset["name"],
            "fullText": full_text,
            "prompt": full_text,
            "completion": full_text,
            "intent": "data",  # Dataset row data
            "category": "dataset_row",
            "rowIndex": idx,
            "metadata": metadata
        }
        rag_documents.append(rag_doc)

    return rag_documents

@router.post("/rag/index")
async def index_document_for_rag(request: RAGIndexRequest):
    """Index a parsed document for RAG search"""
    try:
        storage_dir = get_storage_dir()
        cache_dir = os.path.join(storage_dir, "cache")
        cache_file = os.path.join(cache_dir, f"{request.file_id}_parsed.json")

        if not os.path.exists(cache_file):
            raise HTTPException(status_code=404, detail="Parsed data not found. Please parse the document first.")

        # Load parsed data
        with open(cache_file, 'r', encoding='utf-8') as f:
            parsed_data = json.load(f)

        # Convert to RAG format
        dataset_name = request.dataset_name or parsed_data.get('filename', f"Document {request.file_id}")
        rag_documents = convert_parsed_data_to_rag_documents(request.file_id, parsed_data, dataset_name)

        # Index documents
        indexed_count = 0
        for doc in rag_documents:
            if doc['id'] not in rag_index['embeddings']:
                # Create embedding
                embedding = create_simple_embedding(doc['fullText'])
                rag_index['embeddings'][doc['id']] = embedding
                rag_index['documents'].append(doc)
                indexed_count += 1

        # Update stats
        if request.file_id not in rag_index['indexed_datasets']:
            rag_index['indexed_datasets'].add(request.file_id)
            rag_index['stats']['indexed_datasets'] += 1

        rag_index['stats']['total_documents'] += indexed_count
        rag_index['stats']['last_updated'] = datetime.now().isoformat()

        # Save index to disk
        save_rag_index()

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully indexed {indexed_count} paragraphs for RAG search",
                "file_id": request.file_id,
                "dataset_name": dataset_name,
                "indexed_paragraphs": indexed_count,
                "total_documents": rag_index['stats']['total_documents']
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG indexing failed: {str(e)}")

@router.post("/rag/search")
async def search_rag(request: RAGSearchRequest):
    """Search indexed documents using RAG"""
    try:
        if not rag_index['documents']:
            return JSONResponse(
                status_code=200,
                content={
                    "results": [],
                    "total_results": 0,
                    "message": "No documents indexed yet"
                }
            )

        # Create query embedding
        query_embedding = create_simple_embedding(request.query)

        # Filter documents if dataset IDs specified
        search_documents = rag_index['documents']
        if request.datasetIds:
            search_documents = [doc for doc in search_documents if doc['datasetId'] in request.datasetIds]

        # Calculate similarities
        results = []
        threshold_value = request.threshold if request.threshold is not None else 0.1
        for doc in search_documents:
            doc_embedding = rag_index['embeddings'].get(doc['id'])
            if doc_embedding:
                similarity = cosine_similarity(query_embedding, doc_embedding)
                if similarity >= threshold_value:
                    results.append({
                        "document": doc,
                        "similarity": similarity,
                        "relevanceScore": similarity
                    })

        # Sort by similarity and limit results
        results.sort(key=lambda x: x['similarity'], reverse=True)
        limited_results = results[:request.topK]

        return JSONResponse(
            status_code=200,
            content={
                "results": limited_results,
                "total_results": len(limited_results),
                "query": request.query,
                "search_parameters": {
                    "topK": request.topK,
                    "threshold": request.threshold,
                    "datasetIds": request.datasetIds,
                    "searchIn": request.searchIn
                }
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")

@router.post("/rag/context")
async def build_rag_context(request: RAGSearchRequest):
    """Build context from RAG search results"""
    try:
        # First perform search
        search_response = await search_rag(request)
        
        # Extract body content properly
        if hasattr(search_response, 'body'):
            search_data = search_response.body
            if isinstance(search_data, bytes):
                search_data = json.loads(search_data.decode('utf-8'))
            elif isinstance(search_data, (bytearray, memoryview)):
                search_data = json.loads(bytes(search_data).decode('utf-8'))
        else:
            # If it's already a dict or JSONResponse content
            search_data = search_response if isinstance(search_response, dict) else {}

        results = search_data.get('results', []) if isinstance(search_data, dict) else []

        if not results:
            return JSONResponse(
                status_code=200,
                content={
                    "prompt": f"You are a helpful document analysis assistant.\n\nUser Query: {request.query}",
                    "context": [],
                    "hasContext": False,
                    "contextCount": 0
                }
            )

        # Build context
        context_parts = []
        for result in results:
            doc = result['document']
            context_parts.append({
                "source": f"{doc['datasetName']} (Page {doc['metadata']['page']})",
                "content": doc['fullText'],
                "relevanceScore": result['relevanceScore']
            })

        # Build full prompt
        system_prompt = "You are a helpful document analysis assistant."
        context_section = "\n".join([
            f"[Context {i+1}] (Relevance: {(ctx['relevanceScore'] * 100):.1f}%)\n" +
            f"Source: {ctx['source']}\n" +
            f"Content: {ctx['content']}\n"
            for i, ctx in enumerate(context_parts)
        ])

        full_prompt = (
            f"{system_prompt}\n\n" +
            f"Retrieved Context:\n{context_section}\n" +
            f"User Query: {request.query}\n\n" +
            "Please answer the user's query using the provided context when relevant."
        )

        return JSONResponse(
            status_code=200,
            content={
                "prompt": full_prompt,
                "context": context_parts,
                "hasContext": True,
                "contextCount": len(context_parts)
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context building failed: {str(e)}")

@router.get("/rag/stats")
async def get_rag_stats():
    """Get RAG index statistics"""
    return JSONResponse(
        status_code=200,
        content={
            "stats": rag_index['stats'],
            "indexed_datasets": list(rag_index['indexed_datasets']),
            "total_embeddings": len(rag_index['embeddings'])
        }
    )

@router.delete("/rag/dataset/{dataset_id}")
async def remove_rag_dataset(dataset_id: str):
    """Remove a dataset from RAG index"""
    try:
        if dataset_id not in rag_index['indexed_datasets']:
            raise HTTPException(status_code=404, detail="Dataset not found in RAG index")

        # Remove documents and embeddings for this dataset
        rag_index['documents'] = [doc for doc in rag_index['documents'] if doc['datasetId'] != dataset_id]

        embeddings_to_remove = [doc_id for doc_id in rag_index['embeddings'].keys() if doc_id.startswith(f"{dataset_id}_")]
        for doc_id in embeddings_to_remove:
            del rag_index['embeddings'][doc_id]

        rag_index['indexed_datasets'].remove(dataset_id)
        rag_index['stats']['indexed_datasets'] -= 1
        rag_index['stats']['total_documents'] = len(rag_index['documents'])
        rag_index['stats']['last_updated'] = datetime.now().isoformat()

        # Save updated index
        save_rag_index()

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully removed dataset {dataset_id} from RAG index",
                "removed_documents": len(embeddings_to_remove)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove dataset: {str(e)}")

@router.post("/rag/index-dataset")
async def index_ebook_dataset(request: RAGBulkIndexRequest):
    """Bulk index all available parsed documents as an ebook dataset"""
    try:
        storage_dir = get_storage_dir()
        cache_dir = os.path.join(storage_dir, "cache")

        if not os.path.exists(cache_dir):
            raise HTTPException(status_code=404, detail="No cache directory found. No documents have been parsed yet.")

        # Find all parsed JSON files
        parsed_files = [f for f in os.listdir(cache_dir) if f.endswith('_parsed.json')]

        if not parsed_files:
            raise HTTPException(status_code=404, detail="No parsed documents found in cache.")

        total_indexed = 0
        failed_files = []
        dataset_id = f"bulk_{request.dataset_name}_{int(time.time())}"

        # Limit the number of documents if specified
        if request.max_documents:
            parsed_files = parsed_files[:request.max_documents]

        for parsed_file in parsed_files:
            try:
                file_id = parsed_file.replace('_parsed.json', '')
                cache_file = os.path.join(cache_dir, parsed_file)

                # Load parsed data
                with open(cache_file, 'r', encoding='utf-8') as f:
                    parsed_data = json.load(f)

                # Convert to RAG format
                dataset_name = request.dataset_name
                rag_documents = convert_parsed_data_to_rag_documents(file_id, parsed_data, dataset_name)

                # Index documents
                file_indexed_count = 0
                for doc in rag_documents:
                    if doc['id'] not in rag_index['embeddings']:
                        # Create embedding
                        embedding = create_simple_embedding(doc['fullText'])
                        rag_index['embeddings'][doc['id']] = embedding
                        rag_index['documents'].append(doc)
                        file_indexed_count += 1

                total_indexed += file_indexed_count
                print(f"Indexed {file_indexed_count} paragraphs from {file_id}")

            except Exception as e:
                failed_files.append({"file_id": file_id, "error": str(e)})
                print(f"Failed to index {file_id}: {e}")

        # Update stats
        if dataset_id not in rag_index['indexed_datasets']:
            rag_index['indexed_datasets'].add(dataset_id)
            rag_index['stats']['indexed_datasets'] += 1

        rag_index['stats']['total_documents'] += total_indexed
        rag_index['stats']['last_updated'] = datetime.now().isoformat()

        # Save index to disk
        save_rag_index()

        response_data = {
            "message": f"Successfully indexed ebook dataset '{request.dataset_name}'",
            "dataset_id": dataset_id,
            "dataset_name": request.dataset_name,
            "total_files_processed": len(parsed_files),
            "total_documents_indexed": total_indexed,
            "failed_files": len(failed_files),
            "total_rag_documents": rag_index['stats']['total_documents']
        }

        if failed_files:
            response_data["failures"] = failed_files

        return JSONResponse(status_code=200, content=response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk indexing failed: {str(e)}")

@router.post("/rag/index-dataset-file")
async def index_exported_dataset_for_rag(request: RAGIndexRequest):
    """Index an exported dataset for RAG search"""
    try:
        # Load the exported dataset
        dataset = load_exported_dataset(request.file_id)

        # Convert to RAG format
        dataset_name = request.dataset_name or dataset["name"]
        rag_documents = convert_dataset_to_rag_documents(dataset)

        # Index documents
        indexed_count = 0
        for doc in rag_documents:
            if doc['id'] not in rag_index['embeddings']:
                # Create embedding
                embedding = create_simple_embedding(doc['fullText'])
                rag_index['embeddings'][doc['id']] = embedding
                rag_index['documents'].append(doc)
                indexed_count += 1

        # Update stats
        if request.file_id not in rag_index['indexed_datasets']:
            rag_index['indexed_datasets'].add(request.file_id)
            rag_index['stats']['indexed_datasets'] += 1

        rag_index['stats']['total_documents'] += indexed_count
        rag_index['stats']['last_updated'] = datetime.now().isoformat()

        # Save index to disk
        save_rag_index()

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully indexed exported dataset '{dataset_name}'",
                "file_id": request.file_id,
                "dataset_name": dataset_name,
                "format": dataset["format"],
                "total_rows": dataset["row_count"],
                "indexed_documents": indexed_count,
                "total_rag_documents": rag_index['stats']['total_documents']
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset indexing failed: {str(e)}")

@router.get("/rag/available-datasets")
async def get_available_datasets():
    """Get list of available exported datasets for indexing"""
    try:
        datasets = get_available_exported_datasets()
        return JSONResponse(
            status_code=200,
            content={
                "datasets": datasets,
                "total_datasets": len(datasets)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get available datasets: {str(e)}")

@router.get("/rag/indexed-datasets")
async def get_indexed_datasets():
    """Get list of currently indexed datasets with statistics"""
    try:
        # Group documents by datasetId
        datasets_info = {}
        for doc in rag_index['documents']:
            dataset_id = doc['datasetId']
            if dataset_id not in datasets_info:
                datasets_info[dataset_id] = {
                    "datasetId": dataset_id,
                    "datasetName": doc['datasetName'],
                    "documentCount": 0,
                    "category": doc.get('category', 'unknown'),
                    "documents": []
                }
            datasets_info[dataset_id]["documentCount"] += 1
            datasets_info[dataset_id]["documents"].append({
                "id": doc['id'],
                "rowIndex": doc.get('rowIndex', 0),
                "textPreview": doc['fullText'][:100] + "..." if len(doc['fullText']) > 100 else doc['fullText']
            })
        
        # Convert to list
        indexed_datasets = list(datasets_info.values())
        
        return JSONResponse(
            status_code=200,
            content={
                "indexed_datasets": indexed_datasets,
                "total_indexed_datasets": len(indexed_datasets),
                "total_documents": rag_index['stats']['total_documents'],
                "last_updated": rag_index['stats'].get('last_updated')
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get indexed datasets: {str(e)}")

def save_rag_index():
    """Save RAG index to disk"""
    try:
        storage_dir = get_storage_dir()
        rag_dir = os.path.join(storage_dir, "rag")
        os.makedirs(rag_dir, exist_ok=True)

        index_file = os.path.join(rag_dir, "rag_index.json")

        # Prepare data for serialization
        save_data = {
            "documents": rag_index['documents'],
            "embeddings": dict(rag_index['embeddings']),  # Convert Map to dict
            "indexed_datasets": list(rag_index['indexed_datasets']),
            "stats": rag_index['stats'],
            "saved_at": datetime.now().isoformat()
        }

        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)

    except Exception as e:
        print(f"Warning: Could not save RAG index: {e}")

def load_rag_index():
    """Load RAG index from disk"""
    try:
        storage_dir = get_storage_dir()
        rag_dir = os.path.join(storage_dir, "rag")
        index_file = os.path.join(rag_dir, "rag_index.json")

        if os.path.exists(index_file):
            with open(index_file, 'r', encoding='utf-8') as f:
                save_data = json.load(f)

            rag_index['documents'] = save_data.get('documents', [])
            rag_index['embeddings'] = {k: v for k, v in save_data.get('embeddings', {}).items()}
            rag_index['indexed_datasets'] = set(save_data.get('indexed_datasets', []))
            rag_index['stats'] = save_data.get('stats', rag_index['stats'])

            print(f"Loaded RAG index: {len(rag_index['documents'])} documents, {len(rag_index['indexed_datasets'])} datasets")

    except Exception as e:
        print(f"Warning: Could not load RAG index: {e}")

# Load index on startup
load_rag_index()

def load_exported_dataset(file_id: str) -> Dict[str, Any]:
    """Load an exported dataset from the exports directory"""
    exports_dir = get_exports_dir()

    # Try CSV first
    csv_file = os.path.join(exports_dir, f"{file_id}_export.csv")
    if os.path.exists(csv_file):
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                data = list(reader)
                return {
                    "id": file_id,
                    "name": f"{file_id}_export",
                    "data": data,
                    "format": "csv",
                    "row_count": len(data)
                }
        except Exception as e:
            print(f"Error loading CSV dataset {file_id}: {e}")

    # Try JSONL
    jsonl_file = os.path.join(exports_dir, f"{file_id}_export.jsonl")
    if os.path.exists(jsonl_file):
        try:
            data = []
            with open(jsonl_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data.append(json.loads(line.strip()))
            return {
                "id": file_id,
                "name": f"{file_id}_export",
                "data": data,
                "format": "jsonl",
                "row_count": len(data)
            }
        except Exception as e:
            print(f"Error loading JSONL dataset {file_id}: {e}")

    raise HTTPException(status_code=404, detail=f"Exported dataset {file_id} not found")

def get_available_exported_datasets() -> List[Dict[str, Any]]:
    """Get list of all available exported datasets"""
    exports_dir = get_exports_dir()
    datasets = []

    if not os.path.exists(exports_dir):
        return datasets

    for filename in os.listdir(exports_dir):
        if filename.endswith('_export.csv') or filename.endswith('_export.jsonl'):
            file_id = filename.replace('_export.csv', '').replace('_export.jsonl', '')
            try:
                dataset_info = load_exported_dataset(file_id)
                datasets.append({
                    "id": dataset_info["id"],
                    "name": dataset_info["name"],
                    "format": dataset_info["format"],
                    "row_count": dataset_info["row_count"],
                    "filename": filename
                })
            except Exception as e:
                print(f"Error loading dataset info for {file_id}: {e}")

    return datasets