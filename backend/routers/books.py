import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from database import get_db
from parser import parse_chapters, detect_encoding
import os

router = APIRouter(prefix="/api/books", tags=["books"])

CJK_RE = re.compile(r'([一-鿿㐀-䶿豈-﫿])')


def tokenize_for_fts(text: str) -> str:
    return CJK_RE.sub(r' \1 ', text)


@router.get("")
def list_books():
    db = get_db()
    rows = db.execute(
        "SELECT id, title, chapter_count, created_at FROM books ORDER BY created_at DESC"
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]


@router.post("")
async def upload_book(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(400, "仅支持 .txt 文件")

    raw = await file.read()
    enc = detect_encoding(raw)
    text = raw.decode(enc)

    title = os.path.splitext(file.filename)[0]
    chapters = parse_chapters(text)

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO books (title, filename, chapter_count) VALUES (?, ?, ?)",
            (title, file.filename, len(chapters)),
        )
        book_id = cur.lastrowid

        for idx, (ch_title, content) in enumerate(chapters):
            cur2 = db.execute(
                "INSERT INTO chapters (book_id, chapter_index, title, content) VALUES (?, ?, ?, ?)",
                (book_id, idx, ch_title, content),
            )
            db.execute(
                "INSERT INTO chapters_fts (title, content, book_id, book_title, chapter_id, chapter_index) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    tokenize_for_fts(ch_title),
                    tokenize_for_fts(content),
                    book_id,
                    title,
                    cur2.lastrowid,
                    idx,
                ),
            )

        db.commit()
        return {"id": book_id, "title": title, "chapter_count": len(chapters)}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))
    finally:
        db.close()


@router.get("/{book_id}")
def get_book(book_id: int):
    db = get_db()
    book = db.execute("SELECT * FROM books WHERE id=?", (book_id,)).fetchone()
    if not book:
        raise HTTPException(404, "书籍不存在")
    chapters = db.execute(
        "SELECT chapter_index, title FROM chapters WHERE book_id=? ORDER BY chapter_index",
        (book_id,),
    ).fetchall()
    db.close()
    return {**dict(book), "chapters": [dict(c) for c in chapters]}


@router.get("/{book_id}/chapters/{chapter_index}")
def get_chapter(book_id: int, chapter_index: int):
    db = get_db()
    row = db.execute(
        "SELECT * FROM chapters WHERE book_id=? AND chapter_index=?",
        (book_id, chapter_index),
    ).fetchone()
    db.close()
    if not row:
        raise HTTPException(404, "章节不存在")
    return dict(row)


@router.delete("/{book_id}")
def delete_book(book_id: int):
    db = get_db()
    db.execute("DELETE FROM chapters_fts WHERE book_id=?", (book_id,))
    db.execute("DELETE FROM books WHERE id=?", (book_id,))
    db.commit()
    db.close()
    return {"ok": True}
