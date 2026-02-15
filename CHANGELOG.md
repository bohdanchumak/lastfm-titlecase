# Changelog

## 1.2.0

> February 15, 2026

### Autocorrections
- Capitalize words after hyphens, slashes, opening brackets, opening quotes, and equals signs
- Fixed Roman numerals incorrectly capitalizing letters in regular words
- Fixed acronyms matching incomplete patterns
- Fixed opening quotes capitalization applying to contractions ('ll, 've, 're, 'em)
- Fixed capitalization inside brackets applying without a preceding space (e.g., "Blue(s)" no longer becomes "Blue(S)")

### Configuration
- Replacements section - map specific words or full titles to custom casing
- Settings section with a toggle to disable sentence case for non-English titles
- Context menu on last.fm pages to quickly add titles to the replacements list

## 1.1.1

> February 07, 2026

- Mozilla Firefox compatibility
- Replaced third-party title-case library with a built-in implementation

## 1.1.0

> February 06, 2026

### Autocorrections
- Capitalize words after dots
- Non-English titles are now sentence-cased instead of preserving the original casing

### Configuration
- Configuration page for customizing word lists (lowercase, uppercase, capitalized)

## 1.0.0

> January 28, 2026

- Automatic title case correction for song, album, and artist names on last.fm
- For non-English titles, the original casing is preserved with the first letter capitalized
