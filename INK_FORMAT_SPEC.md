# INK FORMAT v1.0 — OFFICIAL SPEC

This project uses the custom `.ink` file format for storing all book and chapter data.

## Rules
- **FILE EXTENSION:** `.ink`
- **ENCODING:** UTF-8 plain text only.
- NO HTML.
- NO emojis.
- NO special fonts.
- NO colors.

## 1. BOOK HEADER (MANDATORY)
Every file MUST start with:
```
@BOOK
TITLE: <book title>
AUTHOR: <author name>
GENRE: <genre>
LANG: <language>
VERSION: <version number>
CREATED: <YYYY-MM-DD>
UPDATED: <YYYY-MM-DD>
```

## 2. CHAPTER STRUCTURE
Each chapter must follow this format:
```
@CHAPTER <number>
TITLE: <chapter title>

<content>

@ENDCHAPTER
```

## 3. SCENE STRUCTURE
Each chapter may contain one or more scenes.
```
@SCENE
LOCATION: <place>
TIME: <time>
POV: <point of view>
MOOD: <mood>

<scene text>

@ENDSCENE
```

## 4. TEXT RULES
- Paragraphs are separated by ONE empty line.
- No line should exceed 120 characters.
- No tab characters.
- Use normal quotes: " "
- Use three dots: ...
- Allowed formatting: `*italic*`, `**bold**`

## 5. INTERNAL TAGS
The following tags are allowed inside text:
- `<<FIX>>`      = Needs revision
- `<<IDEA>>`     = Future idea
- `<<CHECK>>`    = Consistency check
- `<<VERIFY>>`   = Needs fact check

## 6. SPECIAL BLOCKS
- Thoughts: `[[THOUGHT]]...[[ENDTHOUGHT]]`
- Flashback: `[[FLASHBACK]]...[[ENDFLASHBACK]]`
- Dream: `[[DREAM]]...[[ENDDREAM]]`

## 7. NOTES SECTION (OPTIONAL)
```
@NOTES
- Note 1
@ENDNOTES
```

## 8. REVISION HISTORY (MANDATORY)
At end of file:
```
@REVISION
- v1.0 Final
@ENDREVISION
```

## 9. FORBIDDEN ELEMENTS
Never use: HTML, Markdown headers (#), Emojis, Images, Tables, Footnotes, External links.
