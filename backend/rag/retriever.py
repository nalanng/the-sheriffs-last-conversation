"""
Retriever — takes a user query and returns the most relevant
document chunks from ChromaDB.
"""

from backend.rag.vectorstore import load_vectorstore


def get_relevant_context(query: str, k: int = 4) -> str:
    """
    Search the vector store for chunks relevant to the query.
    Returns them as a single concatenated string.
    """
    vectorstore = load_vectorstore()
    results = vectorstore.similarity_search(query, k=k)

    if not results:
        return ""

    context_parts = []
    for doc in results:
        source = doc.metadata.get("source", "unknown")
        context_parts.append(f"[Source: {source}]\n{doc.page_content}")

    return "\n\n---\n\n".join(context_parts)
