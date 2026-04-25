import re
from typing import List, Tuple

# Patterns ordered by specificity — first match wins per line
CHAPTER_RE = re.compile(
    r'^('
    r'第[零〇一二三四五六七八九十百千万亿\d]+[章节回卷集部篇][^\n]{0,50}'
    r'|Chapter\s+\d+[^\n]{0,50}'
    r'|CHAPTER\s+\d+[^\n]{0,50}'
    r'|序章[^\n]{0,50}'
    r'|前言[^\n]{0,50}'
    r'|楔子[^\n]{0,50}'
    r'|尾声[^\n]{0,50}'
    r'|番外[^\n]{0,50}'
    r')$',
    re.MULTILINE | re.IGNORECASE,
)


def parse_chapters(text: str) -> List[Tuple[str, str]]:
    """Return list of (title, content) tuples."""
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    matches = list(CHAPTER_RE.finditer(text))

    if not matches:
        return [("正文", text.strip())]

    chapters: List[Tuple[str, str]] = []

    # Text before first chapter heading → prologue
    prologue = text[:matches[0].start()].strip()
    if prologue:
        chapters.append(("前言", prologue))

    for i, m in enumerate(matches):
        title = m.group(0).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        chapters.append((title, content))

    return chapters


def detect_encoding(raw: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "gbk", "gb18030", "big5"):
        try:
            raw.decode(enc)
            return enc
        except (UnicodeDecodeError, LookupError):
            continue
    return "utf-8"
