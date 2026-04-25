import re
from fastapi import APIRouter, Query
from typing import Optional
from database import get_db

router = APIRouter(prefix="/api/search", tags=["search"])

SNIPPET_LEN = 120
CJK_RE = re.compile(r'([一-鿿㐀-䶿豈-﫿])')


def tokenize_query(q: str) -> str:
    """Tokenize query for FTS — space out CJK chars, keep latin words intact."""
    return CJK_RE.sub(r' \1 ', q).strip()


def make_snippet(content: str, query: str) -> str:
    q = query.strip()
    idx = content.find(q) if q else -1
    if idx == -1:
        return content[:SNIPPET_LEN] + ("…" if len(content) > SNIPPET_LEN else "")
    start = max(0, idx - 30)
    end = min(len(content), idx + SNIPPET_LEN - 30)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(content) else ""
    return prefix + content[start:end] + suffix


@router.get("")
def search(
    q: str = Query(..., min_length=1),
    book_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    db = get_db()
    offset = (page - 1) * page_size
    fts_q = tokenize_query(q)

    if book_id is not None:
        sql = """
            SELECT f.book_id, f.book_title, f.chapter_id, f.chapter_index,
                   c.title, c.content, f.rank
            FROM chapters_fts f
            JOIN chapters c ON c.id = f.chapter_id
            WHERE f.chapters_fts MATCH ? AND f.book_id = ?
            ORDER BY rank
            LIMIT ? OFFSET ?
        """
        count_sql = "SELECT count(*) FROM chapters_fts WHERE chapters_fts MATCH ? AND book_id=?"
        rows = db.execute(sql, (fts_q, book_id, page_size, offset)).fetchall()
        total = db.execute(count_sql, (fts_q, book_id)).fetchone()[0]
    else:
        sql = """
            SELECT f.book_id, f.book_title, f.chapter_id, f.chapter_index,
                   c.title, c.content, f.rank
            FROM chapters_fts f
            JOIN chapters c ON c.id = f.chapter_id
            WHERE f.chapters_fts MATCH ?
            ORDER BY rank
            LIMIT ? OFFSET ?
        """
        count_sql = "SELECT count(*) FROM chapters_fts WHERE chapters_fts MATCH ?"
        rows = db.execute(sql, (fts_q, page_size, offset)).fetchall()
        total = db.execute(count_sql, (fts_q,)).fetchone()[0]

    db.close()

    results = []
    for r in rows:
        results.append({
            "book_id": r["book_id"],
            "book_title": r["book_title"],
            "chapter_id": r["chapter_id"],
            "chapter_index": r["chapter_index"],
            "chapter_title": r["title"],
            "snippet": make_snippet(r["content"], q),
        })

    return {"total": total, "page": page, "page_size": page_size, "results": results}
