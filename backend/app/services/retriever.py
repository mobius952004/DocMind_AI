class RetrieverService:

    def __init__(self, vector_store):
        self.retriever = vector_store.get_retriever()

    def retrieve(self, query):

        return self.retriever.invoke(query)