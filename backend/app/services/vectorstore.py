from langchain_chroma import Chroma


class VectorStoreService:

    def __init__(self, embeddings):
        print(embeddings)
        self.vector_store = Chroma(
            collection_name="interview_questions",
            embedding_function=embeddings,
            persist_directory="chroma_db"
        )

    def add_documents(self, chunks):
        self.vector_store.add_documents(chunks)

    def get_retriever(self):
        return self.vector_store.as_retriever(
            search_kwargs={"k":4}
        )