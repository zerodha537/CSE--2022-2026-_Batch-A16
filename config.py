import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-123-change-in-production'
    GEMINI_API_KEY = "Your_api_key_here"
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    SESSION_TYPE = 'filesystem'
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
    
    # Interview settings
    QUESTION_TIME_LIMIT = 120  # seconds
    CODING_TIME_LIMIT = 600  # seconds
    
    # Database
    DATABASE = 'database.sqlite'
    
    # Ollama Configuration
    OLLAMA_BASE_URL = os.environ.get('OLLAMA_BASE_URL') or 'http://localhost:11434'
    OLLAMA_MODEL = 'llama3.2:1b'