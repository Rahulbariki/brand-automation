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
    fullname = Column(String, nullable=True)

    password = Column(String, nullable=False)

    # Role-based system
    role = Column(String, default="user")  
    # Possible values: user, admin, superadmin

    is_active = Column(Boolean, default=True)

    # Subscription tier (for Stripe later)
    subscription_plan = Column(String, default="free")
    # free, pro, enterprise
    
    # Stripe Integration
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    usage_logs = relationship("UsageLog", back_populates="user")


# =========================
# USAGE LOG MODEL
# =========================

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    feature = Column(String)  
    # brand_generator
    # logo_generator
    # content_generator
    # sentiment
    # chat

    tokens_used = Column(Integer, default=0)

    request_payload = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="usage_logs")
