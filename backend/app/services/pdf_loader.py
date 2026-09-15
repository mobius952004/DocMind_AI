from langchain_community.document_loaders import PyPDFLoader
from pathlib import Path
from typing import Union

class PdfLoaderService:

    def load_pdf(self, file_path: Union[str, Path]):
        path = Path(file_path).resolve()

        if not path.exists():
            raise FileNotFoundError(f"PDF file does not exist at: {path}")

        loader = PyPDFLoader(str(path))
        return loader.load()