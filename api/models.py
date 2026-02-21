from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# =========================
# USER MODEL
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    supabase_id = Column(String, unique=True, index=True, nullable=True) # UUID from Supabase 'sub' claim
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

    # Subscription tier
    subscription_plan = Column(String, default="free") # free, pro, enterprise
    subscription_status = Column(String, default="active") # active, inactive
    plan_source = Column(String, default="default") # stripe, admin, coupon, default
    
    # Stripe Integration
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    generated_content = relationship("GeneratedContent", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    owned_teams = relationship("Team", back_populates="owner", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")


# =========================
# BRAND WORKSPACE MODEL
# =========================

class BrandWorkspace(Base):
    __tablename__ = "brand_workspaces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    brand_name = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    keywords = Column(String, nullable=True)
    color_palette = Column(String, nullable=True)
    logo_prompt = Column(String, nullable=True)
    tagline = Column(String, nullable=True)
    brand_story = Column(Text, nullable=True)
    health_score = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="workspaces")


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

    api_used = Column(String)
    tokens_used = Column(Integer, default=0)
    request_count = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="usage_logs")

# =========================
# TEAM MODELS
# =========================

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    team_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="member") # admin, editor, viewer
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


# =========================
# WORKSPACE MODELS
# =========================

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    project_name = Column(String)
    industry = Column(String)
    tone = Column(String)
    audience = Column(String)
    vibe = Column(String)

    brand_name = Column(String, nullable=True)
    tagline = Column(String, nullable=True)
    color_palette = Column(JSON, nullable=True)
    fonts = Column(JSON, nullable=True)
    logo_prompt = Column(String, nullable=True)
    brand_story = Column(Text, nullable=True)
    
    health_score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="workspaces")
    assets = relationship("WorkspaceAsset", back_populates="workspace", cascade="all, delete-orphan")
    timeline = relationship("WorkspaceActivity", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceAsset(Base):
    __tablename__ = "workspace_assets"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    asset_type = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workspace = relationship("Workspace", back_populates="assets")


class WorkspaceActivity(Base):
    __tablename__ = "workspace_activities"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="timeline")
