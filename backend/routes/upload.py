import os
import shutil
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import UploadResponse, ColumnInfo
from config import settings

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Accept a CSV file, save it, and return column info + preview."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    # Give the file a unique name to avoid collisions
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Parse preview
    try:
        df = pd.read_csv(file_path, nrows=50)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    if df.empty:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    columns = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        samples = df[col].dropna().head(5).tolist()
        columns.append(ColumnInfo(name=col, dtype=dtype, sample_values=samples))

    preview = df.head(50).fillna("").to_dict(orient="records")

    return UploadResponse(
        filename=safe_name,
        row_count=len(df),
        columns=columns,
        preview=preview,
    )
