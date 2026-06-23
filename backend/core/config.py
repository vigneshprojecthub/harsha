from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/harsha_gallery"

    # App
    SECRET_KEY: str = "harsha-art-gallery-secret-key-2024"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB

    # WhatsApp
    WHATSAPP_NUMBER: str = "919876543210"
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "harsha_gallery_verify_2025"

    # Replicate AI
    REPLICATE_API_TOKEN: str = ""

    # Public URLs
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    PUBLIC_FRONTEND_URL: str = "http://localhost:5173"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "Harsha Art Gallery <harsha@artgallery.com>"

    # Instagram
    INSTAGRAM_ACCESS_TOKEN: str = ""
    INSTAGRAM_BUSINESS_ID: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"   # ignore unknown env vars from Render


settings = Settings()
