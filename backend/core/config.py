from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Complaint Analyzer"
    VERSION: str = "2.0.0"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Email SMTP (Default / Fallback account)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str
    
    # Admin email for manual review notifications
    ADMIN_EMAIL: str = ""
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OpenAI / Gemini (global defaults, can be overridden per agent config)
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    
    # Orchestrator defaults
    DEFAULT_MODEL_PROVIDER: str = "gemini"
    DEFAULT_MODEL_NAME: str = "gemini-pro"
    DEFAULT_TEMPERATURE: float = 0.0
    AI_CONFIDENCE_THRESHOLD: float = 0.8
    
    class Config:
        env_file = ".env"

settings = Settings()
