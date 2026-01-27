A browser extension that fixes song, album, and artist name casing on last.fm.

## Why?

Last.fm displays track, album, and artist names/titles exactly as they were scrobbled, which often results in inconsistent and ugly casing like "ALL CAPS TITLE" or "all lowercase title". This extension aims to automatically convert them to proper title case (or sentence case for Cyrillic alphabets).

| Before | After |
|--------|-------|
| ![Before](screenshots/before.png) | ![After](screenshots/after.png) |

## Features

- converts text to title case with smart handling of common words (a, the, of, etc.)
- detects Cyrillic text and applies sentence case instead
- uppercases Roman numerals (I, II, III, IV, etc.)
- works on dynamically loaded content

## Installation

### From Source

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Load the extension in your browser:
   - **Chrome/Edge:** Go to `chrome://extensions` or `edge://extensions`, enable "Developer mode", click "Load unpacked", and select the project folder
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select `manifest.json`
