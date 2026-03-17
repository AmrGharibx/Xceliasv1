# RED Report Generator — No API Key Required

A complete, interactive web application for generating professional A4 trainee performance reports for **RED Real Estate Domain Training Academy**. No API key, no signup, no cost — everything runs 100% in your browser.

![License](https://img.shields.io/badge/license-MIT-blue)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)
![No API](https://img.shields.io/badge/API-Not%20Required-green)

## Features

- **Zero API Dependency** — No AI key, no signup, no external calls. All text is generated from a built-in Smart Template Engine
- **Smart Text Engine** — Automatically generates assessment paragraphs, trainer comments, and concluding remarks from scores
- **Screenshot Reference** — Upload evaluation screenshots as a visual reference panel while you enter scores
- **Drag & Drop Upload** — Add multiple images at once with drag-and-drop or file picker
- **Auto-Calculation** — Tech Score %, Soft Score %, Overall %, and assessment tier computed automatically
- **Editable Cards** — Expand trainee cards to edit any field. Regenerate text with one click
- **Pixel-Perfect A4 Reports** — Cover page, individual trainee pages, and concluding remarks — all formatted to A4
- **PDF Download** — In-browser PDF generation (html2canvas + jsPDF)
- **Print Support** — Perfect print-to-PDF via browser print dialog
- **Persistent Settings** — Company name and batch saved in localStorage

## Quick Start

### Option 1: GitHub Pages (Recommended)
1. Fork this repo
2. Go to **Settings → Pages → Source: main / root**
3. Your app will be live at `https://<username>.github.io/Report-Generation-/`

### Option 2: Open Locally
Just open `index.html` in Chrome or Edge. No server needed.

## How to Use

### Step 1 — Setup
Enter your company name and batch number. That's it — no API key needed.

### Step 2 — Upload Screenshots (Optional)
Upload your evaluation spreadsheet screenshots. They'll be displayed as a visual reference strip while you enter data. You can skip this step if you prefer.

### Step 3 — Enter Trainee Data
Enter scores from your screenshots into the trainee cards. Everything else is auto-generated:
- **Recalculate All** — recomputes all derived scores and regenerates all text
- **Auto-Generate** — regenerates assessment or comments for a specific trainee
- All text fields are fully editable if you want to customize

### Step 4 — Report Preview
View the full A4 report. Then:
- **Download PDF** — saves directly as a PDF file
- **Print** — opens browser print dialog (use "Save as PDF" for best quality)

## Smart Text Engine

The built-in text engine generates professional report text from numerical scores:

- **Overall Assessment** — Multi-sentence paragraph covering strengths, weaknesses, tech score analysis, professionalism, and attendance
- **Trainer's Comments** — Concise summary highlighting key areas
- **Concluding Remarks** — Automatic outro page grouping trainees by tier with appropriate language

All generated text is fully editable — change anything you want before generating the report.

## Assessment Tiers

| Score | Result | Badge |
|-------|--------|-------|
| ≥ 90% | Aced | 🟢 Green |
| ≥ 80% | Excellent | 🔵 Blue |
| ≥ 70% | Good | 🟡 Yellow |
| ≥ 60% | Passed | ⚪ Gray |
| < 60% | Failed | 🔴 Red |

## Tech Stack

- **HTML/CSS/JS** — Single-file, zero dependencies (no framework, no build step)
- **Google Fonts** — Sora + Playfair Display
- **html2canvas** — DOM-to-canvas rendering for PDF
- **jsPDF** — Client-side PDF generation
- **Built-in Smart Template Engine** — No external AI service needed

## Score Calculation

```
totalCore = productKnowledge + mapping
techScore% = (totalCore / 10) × 100
conductRating = presentability + softSkills
softScore% = (conductRating / 10) × 100
overallScore = (techScore% + softScore%) / 2
```

## Privacy

- **No API keys required or stored**
- **No data sent to any external server**
- Screenshots stay in your browser — never uploaded anywhere
- The app runs 100% client-side with zero network calls

## License

MIT — use freely.
