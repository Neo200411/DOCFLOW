import sys, os, jwt
from datetime import datetime, timezone, timedelta
sys.path.append(os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv()
from app.routers.auth import JWT_SECRET, ALGORITHM
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()
user = db.query(User).first()

payload = {
    "sub": str(user.user_id),
    "exp": datetime.now(timezone.utc) + timedelta(days=7)
}
token = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
print(token)
