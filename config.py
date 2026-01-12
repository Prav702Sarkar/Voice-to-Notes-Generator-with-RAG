import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ENV = os.environ.get('FLASK_ENV', 'production')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    VECTOR_DB_PATH = "faiss_index"
    EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2" 
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024
    SEND_FILE_MAX_AGE_DEFAULT = 0
    JSON_SORT_KEYS = False
    
    @staticmethod
    def init_app(app):
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)
        if not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY environment variable is not set")