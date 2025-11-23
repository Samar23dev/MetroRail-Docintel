from sentence_transformers import SentenceTransformer
import numpy as np

# Load pre-trained model
model = SentenceTransformer('all-MiniLM-L6-v2')

def semantic_search(query, documents_collection, top_k=5):
    """Perform semantic search on documents"""
    try:
        # Get all documents
        all_documents = list(documents_collection.find({}))
        
        if not all_documents:
            return []
        
        # Generate embedding for query
        query_embedding = model.encode(query, convert_to_tensor=False)
        
        # Calculate similarity for each document
        results = []
        for doc in all_documents:
            # Create embedding for document summary
            doc_text = f"{doc.get('title', '')} {doc.get('summary', '')}"
            doc_embedding = model.encode(doc_text, convert_to_tensor=False)
            
            # Calculate cosine similarity
            similarity = calculate_similarity(query_embedding, doc_embedding)
            
            doc['similarity'] = float(similarity)
            results.append(doc)
        
        # Sort by similarity and return top results
        results = sorted(results, key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
    except Exception as e:
        raise Exception(f"Semantic search error: {str(e)}")


def calculate_similarity(embedding1, embedding2):
    """Calculate cosine similarity between two embeddings"""
    # Normalize embeddings
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0
    
    # Calculate cosine similarity
    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
    return similarity
