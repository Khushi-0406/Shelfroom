from pathlib import Path
from uuid import uuid4
from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image


# =========================================================
# FILE SIZE LIMITS
# =========================================================

MAX_COVER_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_PDF_SIZE = 50 * 1024 * 1024        # 50 MB


# =========================================================
# BASE DIRECTORIES
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# COVER UPLOAD
# =========================================================

COVERS_DIR = BASE_DIR / "media" / "covers"

COVERS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}


async def save_cover(file: UploadFile) -> str:

    # Validate declared file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]

    # Read only slightly more than the allowed size
    content = await file.read(MAX_COVER_SIZE + 1)

    # Validate file size
    if len(content) > MAX_COVER_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Cover image must be 5 MB or smaller"
        )

    # Validate actual image content
    try:
        image = Image.open(BytesIO(content))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )

    # Make sure actual format matches declared type
    expected_formats = {
        "image/jpeg": "JPEG",
        "image/png": "PNG",
        "image/webp": "WEBP"
    }

    try:
        image = Image.open(BytesIO(content))

        if image.format != expected_formats[file.content_type]:
            raise HTTPException(
                status_code=400,
                detail="Image file type does not match its content"
            )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )

    # Generate safe random filename
    filename = f"{uuid4()}{extension}"

    file_path = COVERS_DIR / filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return f"media/covers/{filename}"


# =========================================================
# PDF UPLOAD
# =========================================================

PDF_DIR = BASE_DIR / "media" / "books"

PDF_DIR.mkdir(
    parents=True,
    exist_ok=True
)


async def save_pdf(file: UploadFile) -> str:

    # Validate declared file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Read only slightly more than the allowed size
    content = await file.read(MAX_PDF_SIZE + 1)

    # Validate file size
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF must be 50 MB or smaller"
        )

    # Validate actual PDF signature
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file"
        )

    # Generate safe random filename
    filename = f"{uuid4()}.pdf"

    file_path = PDF_DIR / filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return f"media/books/{filename}"

def delete_cover(cover_path: str | None):
    if not cover_path:
        return

    file_path = BASE_DIR / cover_path

    if file_path.exists() and file_path.is_file():
        file_path.unlink()


def delete_pdf(pdf_path: str | None):
    if not pdf_path:
        return

    file_path = BASE_DIR / pdf_path

    if file_path.exists() and file_path.is_file():
        file_path.unlink()