import os
import sys

# Ensure the backend package path is on sys.path so `import app` works when tests run from repo root
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
