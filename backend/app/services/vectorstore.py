from langchain_chroma import Chroma


class VectorStoreService:

    def __init__(self, embeddings):
        print(embeddings)
        self.vector_store = Chroma(
            collection_name="interview_questions",
            embedding_function=embeddings,
            persist_directory="chroma_db"
        )

    def add_documents(self, chunks, batch_size=32):
        if not chunks:
            return
        # Batch document embedding to prevent context/memory limits
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            self.vector_store.add_documents(batch)

    def get_retriever(self):
        return self.vector_store.as_retriever(
            search_kwargs={"k":3}
        )