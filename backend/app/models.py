from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# =========================
# USER MODEL
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    # Hashed password for email auth, nullable for OAuth if we decide to enforce OAuth only, 
    # but based on requirements we have both.
    hashed_password = Column(String, nullable=True) 

    fullname = Column(String, nullable=True)
    
    # Auth Provider (email, google)
    provider = Column(String, default="email")

    # Role-based system
    is_admin = Column(Boolean, default=False)
    # We can keep 'role' for more granularity if needed, but requirements said "is_admin = True"
    role = Column(String, default="user") # user, admin, superadmin

    is_active = Column(Boolean, default=True)

    # Subscription tier (for Stripe later)
    subscription_plan = Column(String, default="free")
    
    # Stripe Integration
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    generated_content = relationship("GeneratedContent", back_populates="user")
    # Keeping usage_logs for backward compatibility or extra logging
    usage_logs = relationship("UsageLog", back_populates="user")


# =========================
# GENERATED CONTENT MODEL
# =========================

class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    content_type = Column(String) # brand_name, logo, marketing_copy, etc.
    content = Column(Text) # JSON string or text content
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="generated_content")


# =========================
# USAGE LOG MODEL (Legacy/Analytics)
# =========================

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    feature = Column(String)
    tokens_used = Column(Integer, default=0)
    request_payload = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="usage_logs")
