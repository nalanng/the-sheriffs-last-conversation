#!/usr/bin/env bash
# Render build script — install dependencies and build vector store
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Download TextBlob corpora (needed for sentiment analysis)
python -m textblob.download_corpora

# Build ChromaDB vector store from raw documents
python -m backend.rag.vectorstore
