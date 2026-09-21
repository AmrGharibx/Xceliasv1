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

## Verified price intelligence

Property Explorer now has a source-backed price monitor at
`scraper/price-intelligence/`. It deliberately replaces neither a missing price
nor an uncertain match with a guess.

- Every six hours it checks the public Nawy and RED project inventories.
- Once per day it adds Property Finder's public new-project index as a wider
  cross-check.
- A value is shown in the explorer only when it is a verified **starting price**.
  Older generated ranges are hidden rather than presented as current pricing.
- A large change seen from only one source is held for the next matching run;
  two matching sources can confirm it immediately.
- The project modal shows its verification date and a direct link to the public
  source. Price alerts refresh from these verified values when the explorer
  loads.

Useful commands:

```bash
npm.cmd run test:prices
npm.cmd run prices:check
npm.cmd run prices:daily
```

The GitHub Actions workflow in `.github/workflows/update-property-prices.yml`
runs the unattended schedule and commits only verified data changes, allowing
the normal Vercel Git deployment to publish them. Add any future official
developer source only after it has been reviewed in
`scraper/price-intelligence/config.json`.

## 📝 License

MIT License - Built for RED Training Academy
