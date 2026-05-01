"""
Vector store — embeds document chunks into ChromaDB
using OpenAI embeddings, and provides a retriever.
"""

import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

load_dotenv()

PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "chroma_db")


def get_embeddings():
    """Return the OpenAI embedding model."""
    return OpenAIEmbeddings(model="text-embedding-ada-002")


def create_vectorstore(chunks: list) -> Chroma:
    """Create a new ChromaDB vector store from document chunks."""
    embeddings = get_embeddings()
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=PERSIST_DIR,
    )
    print(f"Vector store created with {len(chunks)} chunks at {PERSIST_DIR}")
    return vectorstore


def load_vectorstore() -> Chroma:
    """Load an existing ChromaDB vector store from disk."""
    embeddings = get_embeddings()
    vectorstore = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embeddings,
    )
    return vectorstore


def build_vectorstore():
    """Full pipeline: load docs -> chunk -> embed -> store."""
    from backend.rag.loader import load_all_documents, split_documents

    docs = load_all_documents()
    chunks = split_documents(docs)
    vectorstore = create_vectorstore(chunks)
    return vectorstore


if __name__ == "__main__":
    build_vectorstore()
    print("Vector store built successfully.")
