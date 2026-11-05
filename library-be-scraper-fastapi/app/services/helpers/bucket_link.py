import os
from app.initializers import env

def build_bucket_link(local_path: str):
    """Return public bucket URL for a local download path when BUCKET_LINK is set."""
    bucket_link = env.BUCKET_LINK
    if not bucket_link or not local_path:
        return local_path

    bucket_link = bucket_link.rstrip("/")
    try:
        rel_path = os.path.relpath(local_path, start=os.getcwd())
    except ValueError:
        return local_path

    rel_path = rel_path.replace(os.sep, "/")
    return f"{bucket_link}/{rel_path}"
