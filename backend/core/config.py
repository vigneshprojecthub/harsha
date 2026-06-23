from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://harsha_user:Harsha123@localhost:5432/harsha_gallery"
    SECRET_KEY: str = "harsha-art-gallery-secret-key-2024"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    WHATSAPP_NUMBER: str = "919344946069"  # Replace with actual number
    REPLICATE_API_TOKEN: str = ""       # Get from replicate.com/account
    PUBLIC_BASE_URL: str = "http://localhost:8000"  # Used for Replicate to fetch images

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
