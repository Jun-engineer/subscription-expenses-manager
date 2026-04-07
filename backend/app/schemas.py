from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserOut(UserBase):
    id: UUID
    preferred_currency: Optional[str] = None
    timezone: Optional[str] = None

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    name: str
    price: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    billing_cycle: Literal["monthly", "yearly", "weekly", "custom"]
    billing_interval: int = Field(default=1, ge=1)
    billing_day: Optional[int] = Field(default=None, ge=1, le=31)
    start_date: Optional[date] = None
    next_payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    active: bool = True
    category: Optional[str] = None
    notes: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    billing_cycle: Optional[Literal["monthly", "yearly", "weekly", "custom"]] = None
    billing_interval: Optional[int] = Field(default=None, ge=1)
    billing_day: Optional[int] = Field(default=None, ge=1, le=31)
    start_date: Optional[date] = None
    next_payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    active: Optional[bool] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class SubscriptionOut(SubscriptionBase):
    id: UUID

    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    date: date
    amount: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    category: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    category: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: UUID

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: UUID
    type: str
    payload: dict | None = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VaultEntryCreate(BaseModel):
    site_name: str = Field(min_length=1)
    site_url: Optional[str] = None
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    notes: Optional[str] = None


class VaultEntryUpdate(BaseModel):
    site_name: Optional[str] = None
    site_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    notes: Optional[str] = None


class VaultEntryOut(BaseModel):
    id: UUID
    site_name: str
    site_url: Optional[str] = None
    username: str
    password: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True
