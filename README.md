# YouTube Time Warning

Chrome extension that displays a growing red border while watching YouTube, helping you stay aware of time spent.

## Features

- Red border that intensifies the longer you watch
- AI-powered video classification (requires local server)
- Configurable warning time and confidence threshold

## Installation

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder

## Requirements

Requires a classification server running at `http://localhost:5000/classify` that accepts POST requests with `{ title: string }` and returns `{ confidence: number }`.
