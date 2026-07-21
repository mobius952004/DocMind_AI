from langchain_community.document_loaders import PyPDFLoader
from pathlib import Path

class PdfLoaderService:
    def __init__(self):
        self.upload_dir=(
            Path(__file__).resolve().parent.parent.parent/ "uploads"
        )



    def load_pdf(self,filename:str):
        pdf_path=self.upload_dir/filename

        if not pdf_path.exists():
            raise FileNotFoundError(f"{filename} does not exist.")


        loader=PyPDFLoader(str(pdf_path))
             
        return loader.load()