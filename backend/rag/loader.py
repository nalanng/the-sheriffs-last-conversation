"""
Document loader — reads PDFs and TXT files from data/raw/,
splits them into chunks for embedding.
"""

import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")


def load_all_documents() -> list:
    """Walk through data/raw/ and load every PDF and TXT file."""
    docs = []

    for root, _dirs, files in os.walk(RAW_DATA_DIR):
        for filename in files:
            filepath = os.path.join(root, filename)

            if filename.lower().endswith(".pdf"):
                loader = PyPDFLoader(filepath)
                docs.extend(loader.load())

            elif filename.lower().endswith(".txt"):
                loader = TextLoader(filepath, encoding="utf-8")
                docs.extend(loader.load())

    print(f"Loaded {len(docs)} raw document pages/sections.")
    return docs


def split_documents(docs: list, chunk_size: int = 800, chunk_overlap: int = 200) -> list:
    """Split documents into smaller chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks.")
    return chunks


if __name__ == "__main__":
    documents = load_all_documents()
    chunks = split_documents(documents)
    for i, chunk in enumerate(chunks[:3]):
        print(f"\n--- Chunk {i} (source: {chunk.metadata.get('source', '?')}) ---")
        print(chunk.page_content[:200])
