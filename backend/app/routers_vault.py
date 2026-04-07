from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .deps import get_db, get_current_user
from .schemas import VaultEntryCreate, VaultEntryOut, VaultEntryUpdate
from .models import VaultEntry, User
from .crypto import encrypt, decrypt

router = APIRouter(prefix="/api/v1/vault", tags=["vault"])


@router.get("", response_model=list[VaultEntryOut])
def list_vault(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(VaultEntry)
        .filter(VaultEntry.user_id == user.id)
        .order_by(VaultEntry.created_at.desc())
        .all()
    )
    return [
        VaultEntryOut(
            id=r.id,
            site_name=r.site_name,
            site_url=r.site_url,
            username=r.username,
            password=decrypt(r.encrypted_password),
            notes=r.notes,
        )
        for r in rows
    ]


@router.post("", response_model=VaultEntryOut, status_code=201)
def create_vault(payload: VaultEntryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = VaultEntry(
        user_id=user.id,
        site_name=payload.site_name,
        site_url=payload.site_url,
        username=payload.username,
        encrypted_password=encrypt(payload.password),
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return VaultEntryOut(
        id=entry.id,
        site_name=entry.site_name,
        site_url=entry.site_url,
        username=entry.username,
        password=decrypt(entry.encrypted_password),
        notes=entry.notes,
    )


@router.get("/{item_id}", response_model=VaultEntryOut)
def get_vault(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = db.query(VaultEntry).filter(VaultEntry.id == item_id, VaultEntry.user_id == user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    return VaultEntryOut(
        id=entry.id,
        site_name=entry.site_name,
        site_url=entry.site_url,
        username=entry.username,
        password=decrypt(entry.encrypted_password),
        notes=entry.notes,
    )


@router.put("/{item_id}", response_model=VaultEntryOut)
def update_vault(item_id: str, payload: VaultEntryUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = db.query(VaultEntry).filter(VaultEntry.id == item_id, VaultEntry.user_id == user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    if payload.site_name is not None:
        entry.site_name = payload.site_name
    if payload.site_url is not None:
        entry.site_url = payload.site_url
    if payload.username is not None:
        entry.username = payload.username
    if payload.password is not None:
        entry.encrypted_password = encrypt(payload.password)
    if payload.notes is not None:
        entry.notes = payload.notes
    db.commit()
    db.refresh(entry)
    return VaultEntryOut(
        id=entry.id,
        site_name=entry.site_name,
        site_url=entry.site_url,
        username=entry.username,
        password=decrypt(entry.encrypted_password),
        notes=entry.notes,
    )


@router.delete("/{item_id}")
def delete_vault(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = db.query(VaultEntry).filter(VaultEntry.id == item_id, VaultEntry.user_id == user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"status": "deleted"}
