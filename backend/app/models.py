from datetime import datetime, date
import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, Boolean, ForeignKey, Numeric, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    display_name = Column(Text)
    preferred_currency = Column(Text, default="JPY")
    timezone = Column(Text, default="Asia/Tokyo")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all,delete")
    expenses = relationship("Expense", back_populates="user", cascade="all,delete")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(Text, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    currency = Column(Text, nullable=False)
    billing_cycle = Column(Text, nullable=False)  # monthly, yearly, weekly, custom
    billing_interval = Column(Integer, default=1)
    billing_day = Column(Integer)
    start_date = Column(Date)
    next_payment_date = Column(Date)
    payment_method = Column(Text)
    active = Column(Boolean, default=True)
    category = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    __table_args__ = (
        Index("ix_subscriptions_user_created", "user_id", "created_at"),
        Index("ix_subscriptions_user_nextpay", "user_id", "next_payment_date"),
    )


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(Text, nullable=False)
    category = Column(Text)
    merchant = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="expenses")
    __table_args__ = (
        Index("ix_expenses_user_date", "user_id", "date"),
    )


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(Text, nullable=False)
    payload = Column(JSONB)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(Text, nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
