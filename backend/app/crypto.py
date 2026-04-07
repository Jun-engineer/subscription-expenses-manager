import base64
import hashlib
from cryptography.fernet import Fernet
from .config import settings


def _get_fernet() -> Fernet:
    if settings.vault_key:
        key = settings.vault_key.encode()
    else:
        # Derive a Fernet-compatible key from the app secret_key
        raw = hashlib.sha256(settings.secret_key.encode()).digest()
        key = base64.urlsafe_b64encode(raw)
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()
