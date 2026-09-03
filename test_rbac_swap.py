import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.config import DATABASE_URL
from app.models.team import UserTeamMembership, Team
from app.models.user import User

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user = db.query(User).first()
membership = db.query(UserTeamMembership).filter_by(user_id=user.user_id).first()

eng_team = db.query(Team).filter_by(name="Engineering").first()
qa_team = db.query(Team).filter_by(name="QA").first()

if membership.team_id == qa_team.team_id:
    print("Moving user to Engineering team (should hide Doc 1, show Doc 2)")
    membership.team_id = eng_team.team_id
else:
    print("Moving user to QA team (should hide Doc 2, show Doc 1)")
    membership.team_id = qa_team.team_id

db.commit()
print("Success!")
