from datetime import timedelta, datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .auth import create_access_token, hash_password, verify_password
from .schemas import Token, UserCreate, UserOut
from .deps import get_db
from .models import User, RefreshToken
from .config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, display_name=payload.display_name or payload.email.split("@")[0], password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token(str(user.id), expires_delta=timedelta(days=7))
    return Token(access_token=token)


@router.post("/login-cookie", response_model=Token)
def login_cookie(response: Response, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access = create_access_token(str(user.id), expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
    # Create a refresh token
    rt = str(uuid4())
    r = RefreshToken(
        user_id=user.id,
        token=rt,
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(r)
    db.commit()
    # Cookies (configurable for prod)
    cookie_kwargs = {
        "httponly": True,
        "samesite": settings.cookie_samesite,
        "secure": settings.cookie_secure,
    }
    if settings.cookie_domain:
        cookie_kwargs["domain"] = settings.cookie_domain
    response.set_cookie("access_token", access, **cookie_kwargs)
    response.set_cookie("refresh_token", rt, **cookie_kwargs)
    return Token(access_token=access)


@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    rec = db.query(RefreshToken).filter(RefreshToken.token == rt, RefreshToken.revoked == False).first()
    if not rec or rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access = create_access_token(str(rec.user_id), expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
    cookie_kwargs = {
        "httponly": True,
        "samesite": settings.cookie_samesite,
        "secure": settings.cookie_secure,
    }
    if settings.cookie_domain:
        cookie_kwargs["domain"] = settings.cookie_domain
    response.set_cookie("access_token", access, **cookie_kwargs)
    return Token(access_token=access)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    rt = request.cookies.get("refresh_token")
    if rt:
        db.query(RefreshToken).filter(RefreshToken.token == rt).update({RefreshToken.revoked: True})
        db.commit()
    # Clear cookies
    delete_kwargs = {}
    if settings.cookie_domain:
        delete_kwargs["domain"] = settings.cookie_domain
    response.delete_cookie("access_token", **delete_kwargs)
    response.delete_cookie("refresh_token", **delete_kwargs)
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_db), request: Request = None):
    # Reuse get_current_user logic by decoding cookie/header
    from .deps import _get_token_from_request
    token = _get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    from .auth import decode_access_token
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
