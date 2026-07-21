from langchain_text_splitters import RecursiveCharacterTextSplitter



class TextSplitter:

     def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )


     def split_documents(self,documents):
        chunks = self.text_splitter.split_documents(documents)

        return chunks