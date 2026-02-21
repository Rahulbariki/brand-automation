from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Team, TeamMember
from dependencies import get_current_user, require_enterprise
from pydantic import BaseModel

router = APIRouter()

class TeamCreateRequest(BaseModel):
    team_name: str

class InviteMemberRequest(BaseModel):
    email: str
    role: str = "member"

@router.post("/create")
def create_team(request: TeamCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    # Check if user already has a team
    existing_team = db.query(Team).filter(Team.owner_user_id == current_user.id).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="You already own a team")
    
    new_team = Team(owner_user_id=current_user.id, team_name=request.team_name)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return {"message": "Team created", "team_id": new_team.id}

@router.post("/invite")
def invite_member(request: InviteMemberRequest, db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    team = db.query(Team).filter(Team.owner_user_id == current_user.id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found. Create a team first.")
        
    user_to_add = db.query(User).filter(User.email == request.email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found.")
        
    # Check if already in team
    existing_member = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == user_to_add.id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User already in team.")
        
    new_member = TeamMember(team_id=team.id, user_id=user_to_add.id, role=request.role)
    db.add(new_member)
    db.commit()
    return {"message": "Member added successfully"}

@router.delete("/member/{user_id}")
def remove_member(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    team = db.query(Team).filter(Team.owner_user_id == current_user.id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    member = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your team.")
        
    db.delete(member)
    db.commit()
    return {"message": "Member removed."}

@router.get("/")
def get_my_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if owner
    owned_team = db.query(Team).filter(Team.owner_user_id == current_user.id).first()
    if owned_team:
        members = db.query(TeamMember).filter(TeamMember.team_id == owned_team.id).all()
        return {
            "is_owner": True,
            "team_id": owned_team.id,
            "team_name": owned_team.team_name,
            "members": [
                {
                    "user_id": m.user_id,
                    "email": m.user.email,
                    "fullname": m.user.fullname,
                    "role": m.role,
                    "joined_at": m.joined_at
                } for m in members
            ]
        }
    
    # Check if member
    membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if membership:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        return {
            "is_owner": False,
            "team_id": team.id,
            "team_name": team.team_name,
            "owner_email": team.owner.email,
            "role": membership.role
        }
    
    return None
