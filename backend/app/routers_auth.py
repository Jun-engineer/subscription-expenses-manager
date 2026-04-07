from datetime import timedelta, datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from .auth import create_access_token, hash_password, verify_password
from .schemas import Token, UserCreate, UserOut
from .deps import get_db, get_current_user
from .models import User, RefreshToken, Notification, Subscription, Expense, VaultEntry
from .config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _cookie_kwargs() -> dict:
    """Common cookie attributes for set/clear operations."""
    ck: dict = {
        "httponly": True,
        "samesite": settings.cookie_samesite,
        "secure": settings.cookie_secure,
        "path": "/",
    }
    if settings.cookie_domain:
        ck["domain"] = settings.cookie_domain
    return ck


def _set_auth_cookies(response: Response, access: str, refresh: str | None = None) -> None:
    kw = _cookie_kwargs()
    response.set_cookie("access_token", access, **kw)
    if refresh:
        response.set_cookie("refresh_token", refresh, **kw)


def _clear_auth_cookies(response: Response) -> None:
    kw = {**_cookie_kwargs(), "max_age": 0, "expires": 0}
    response.set_cookie("access_token", "", **kw)
    response.set_cookie("refresh_token", "", **kw)


@router.post("/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Incorrect email or password")
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
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(r)
    db.commit()
    _set_auth_cookies(response, access, rt)
    return Token(access_token=access)


@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    rec = db.query(RefreshToken).filter(RefreshToken.token == rt, RefreshToken.revoked == False).first()
    if not rec or rec.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access = create_access_token(str(rec.user_id), expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
    _set_auth_cookies(response, access)
    return Token(access_token=access)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    rt = request.cookies.get("refresh_token")
    if rt:
        db.query(RefreshToken).filter(RefreshToken.token == rt).update({RefreshToken.revoked: True})
        db.commit()
    _clear_auth_cookies(response)
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.delete("/account")
def delete_account(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = str(user.id)
    try:
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
        db.query(VaultEntry).filter(VaultEntry.user_id == user_id).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
        db.query(Subscription).filter(Subscription.user_id == user_id).delete(synchronize_session=False)
        db.query(Expense).filter(Expense.user_id == user_id).delete(synchronize_session=False)
        deleted = db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
        if deleted == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="User not found")
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Account deletion failed")
    _clear_auth_cookies(response)
    return {"status": "deleted"}
