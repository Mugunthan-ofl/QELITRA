import time
from typing import Any, Dict, Optional, Callable
from functools import wraps

class InMemoryCache:
    """
    Lightweight in-memory response and calculation cache.
    Stores precomputed results with configurable TTL to accelerate repeated queries.
    Strictly keeps cached artifacts in memory per Rule 4.
    """
    def __init__(self, default_ttl_seconds: int = 300):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self.default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            if time.time() < self._expiry.get(key, 0):
                return self._store[key]
            # Expired
            self.invalidate(key)
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        self._store[key] = value
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._expiry[key] = time.time() + ttl

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)
        self._expiry.pop(key, None)

    def clear(self) -> None:
        self._store.clear()
        self._expiry.clear()

    def cached(self, prefix: str = "", ttl_seconds: Optional[int] = None):
        """Decorator for caching function returns by argument signature."""
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                key = f"{prefix}:{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
                cached_val = self.get(key)
                if cached_val is not None:
                    return cached_val
                result = func(*args, **kwargs)
                self.set(key, result, ttl_seconds)
                return result
            return wrapper
        return decorator

# Global cache instance
cache_manager = InMemoryCache(default_ttl_seconds=300)
