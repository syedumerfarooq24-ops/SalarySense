"""
Supabase client initialization with graceful fallback handling.

If SUPABASE_URL / SUPABASE_KEY are missing or invalid, or the client
otherwise fails to initialize, `supabase_client` will be None and
`is_supabase_available()` will return False. Callers (services/routers)
MUST check this and fall back to safe defaults instead of raising
unhandled 500 errors.
"""
import os
import logging
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger("salarysense.database")

SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")

supabase_client: Optional[Client] = None

try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning(
            "SUPABASE_URL or SUPABASE_KEY not set. "
            "Supabase features will be disabled and endpoints will return fallback data."
        )
    else:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
except Exception as exc:  # noqa: BLE001
    logger.warning("Failed to initialize Supabase client: %s", exc)
    supabase_client = None


def is_supabase_available() -> bool:
    """Returns True if a Supabase client was successfully initialized."""
    return supabase_client is not None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase client instance, or None if unavailable.
    Callers must handle the None case gracefully (fall back to safe defaults).
    """
    return supabase_client