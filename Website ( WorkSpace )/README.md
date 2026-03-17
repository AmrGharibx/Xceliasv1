# RED Training Academy - Egypt Real Estate Map

Interactive real estate explorer for Egypt's top destinations including North Coast, Ain Sokhna, El Gouna, New Capital, and more.

## 🌟 Features

- **Interactive Map** - Explore 1,500+ projects on an interactive map with clustering
- **Smart Search** - AI-powered natural language search ("villas in Sahel with pool")
- **Advanced Filters** - Filter by zone, developer, price, payment plans, amenities
- **Project Comparison** - Compare multiple projects side by side
- **Payment Calculator** - Calculate installments and down payments
- **Bilingual** - Full Arabic/English support
- **Mobile Optimized** - Responsive design for all devices
- **Offline Ready** - PWA with service worker caching

## 🚀 Live Demo

Deployed on Vercel: [Coming Soon]

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, Leaflet.js, GSAP
- **Search**: Fuse.js with Web Worker
- **Styling**: Custom CSS with CSS Variables
- **Deployment**: Vercel Edge Network (Global CDN)

## 📁 Project Structure

```
├── index.html          # Main HTML file
├── app.js              # Core application logic
├── styles.css          # Active stylesheet
├── search.worker.js    # Active Web Worker for search
├── server.ultra.js     # Active Express runtime and route proxy
├── data.json           # Combined project data
├── cairo.json          # Cairo zone projects
├── north_coast.json    # North Coast projects
├── sokhna.json         # Ain Sokhna projects
├── gouna.json          # El Gouna projects
├── others.json         # Other zones
└── scraper/            # Data collection tools
```

## 🏃 Local Development

Run the active server runtime:

```bash
npm start
```

## 📊 Data

- **1,520 projects** across 5 zones
- **1,383 map markers** with coordinates
- Project details include: developer, payment plans, amenities, unit types, delivery dates

## 📝 License

MIT License - Built for RED Training Academy
