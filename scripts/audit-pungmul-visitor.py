"""Visitor-image audit, delegated to original-photo restoration regression."""
import asyncio
from audit_personal_gallery_restore import main
if __name__=="__main__":
    raise SystemExit(asyncio.run(main("pungmul")))
