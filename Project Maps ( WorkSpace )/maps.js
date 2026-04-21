/**
 * Xcelias Project Intelligence Maps — Geographic SVG Map Engine
 * maps.js · RED Training Academy · 2025 (FORCE-DIRECTED LABEL LAYOUT)
 *
 * IMPROVEMENTS:
 * 1. Force-directed label placement with orbital positioning
 * 2. Labels placed in tight orbit around pins (50-60px radius)
 * 3. Iterative simulated annealing to resolve overlaps
 * 4. Short 6-8px connector lines to keep labels proximate
 * 5. Edge penalty to prevent labels escaping to screen edges
 * 6. Preserved organic coastlines and geographic projection
 */
(function () {
  "use strict";

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  /* ═══════════════════════════════════════════════════════════════
     DATA — North Coast (Mediterranean Sea)
     ═══════════════════════════════════════════════════════════════ */
  const NC_ZONES = {
    nc1: { name: "New Alamein", color: "#22d3ee", km: "km 100–123" },
    nc2: { name: "Sidi Abd Rahman", color: "#f87171", km: "km 124–150" },
    nc3: { name: "Al Dabaa", color: "#a78bfa", km: "km 151–178" },
    nc4: { name: "Ras El Hekma", color: "#fbbf24", km: "km 179–225" },
    nc5: { name: "Sidi Heneish", color: "#60a5fa", km: "km 226–275" },
  };

  const NC_PROJECTS = [
    {
      name: "Marina El Alamein",
      dev: "NUCA",
      km: 100,
      lat: 30.8176,
      lng: 29.0592,
      zone: "nc1",
    },
    {
      name: "The Island – Marina 5",
      dev: "NUCA / Marina",
      km: 103,
      lat: 30.8247,
      lng: 29.0086,
      zone: "nc1",
    },
    {
      name: "Palm Hills New Alamein",
      dev: "Palm Hills",
      km: 106,
      lat: 30.8384,
      lng: 28.957,
      zone: "nc1",
    },
    {
      name: "North Edge Towers",
      dev: "City Edge",
      km: 108,
      lat: 30.84,
      lng: 28.932,
      zone: "nc1",
    },
    {
      name: "Lagoons Al Alamein",
      dev: "City Edge",
      km: 110,
      lat: 30.845,
      lng: 28.91,
      zone: "nc1",
    },
    {
      name: "Zahra North Coast",
      dev: "Memaar Al Morshedy",
      km: 112,
      lat: 30.851,
      lng: 28.89,
      zone: "nc1",
    },
    {
      name: "Il Latini SED",
      dev: "Saudi Egyptian Developers",
      km: 115,
      lat: 30.859,
      lng: 28.87,
      zone: "nc1",
    },
    {
      name: "Golf Porto Marina",
      dev: "Amer Group",
      km: 118,
      lat: 30.857,
      lng: 28.85,
      zone: "nc1",
    },
    {
      name: "Marseilia Beach 4",
      dev: "Marseilia Group",
      km: 120,
      lat: 30.86,
      lng: 28.82,
      zone: "nc1",
    },
    {
      name: "Emirates Heights",
      dev: "Yabous",
      km: 122,
      lat: 30.865,
      lng: 28.8,
      zone: "nc1",
    },
    {
      name: "Hacienda Bay",
      dev: "Palm Hills",
      km: 124,
      lat: 30.8651,
      lng: 28.771,
      zone: "nc2",
    },
    {
      name: "Marassi",
      dev: "Emaar Misr",
      km: 126,
      lat: 30.864,
      lng: 28.75,
      zone: "nc2",
    },
    {
      name: "Stella Sidi Abd Rahman",
      dev: "REMCO",
      km: 128,
      lat: 30.862,
      lng: 28.73,
      zone: "nc2",
    },
    {
      name: "La Vista Cascada",
      dev: "La Vista",
      km: 130,
      lat: 30.868,
      lng: 28.71,
      zone: "nc2",
    },
    {
      name: "Seashell Sidi Abd Rahman",
      dev: "New Giza / Seashell",
      km: 132,
      lat: 30.872,
      lng: 28.689,
      zone: "nc2",
    },
    {
      name: "Ghazala Bay",
      dev: "ITR",
      km: 134,
      lat: 30.874,
      lng: 28.67,
      zone: "nc2",
    },
    {
      name: "Amwaj",
      dev: "Tharwa Development",
      km: 136,
      lat: 30.876,
      lng: 28.65,
      zone: "nc2",
    },
    {
      name: "Zoya Ghazala Bay",
      dev: "LMD Sabbour",
      km: 138,
      lat: 30.878,
      lng: 28.63,
      zone: "nc2",
    },
    {
      name: "Hacienda White",
      dev: "Palm Hills",
      km: 141,
      lat: 30.881,
      lng: 28.61,
      zone: "nc2",
    },
    {
      name: "Hacienda Red",
      dev: "Palm Hills",
      km: 143,
      lat: 30.883,
      lng: 28.59,
      zone: "nc2",
    },
    {
      name: "Telal North Coast",
      dev: "Wadi Degla / Roya",
      km: 146,
      lat: 30.885,
      lng: 28.56,
      zone: "nc2",
    },
    {
      name: "Sea View",
      dev: "Jdar Developments",
      km: 148,
      lat: 30.887,
      lng: 28.54,
      zone: "nc2",
    },
    {
      name: "South Med",
      dev: "Hassan Allam / MNHD",
      km: 151,
      lat: 30.89,
      lng: 28.52,
      zone: "nc3",
    },
    {
      name: "Hacienda Blue",
      dev: "Palm Hills",
      km: 155,
      lat: 30.892,
      lng: 28.48,
      zone: "nc3",
    },
    {
      name: "La Vista Bay",
      dev: "La Vista",
      km: 158,
      lat: 30.894,
      lng: 28.45,
      zone: "nc3",
    },
    {
      name: "La Vista Bay East",
      dev: "La Vista",
      km: 160,
      lat: 30.896,
      lng: 28.43,
      zone: "nc3",
    },
    {
      name: "Seazen",
      dev: "Al Ahly Sabbour",
      km: 162,
      lat: 30.898,
      lng: 28.41,
      zone: "nc3",
    },
    {
      name: "The Waterway",
      dev: "The Waterway Devs",
      km: 165,
      lat: 30.902,
      lng: 28.38,
      zone: "nc3",
    },
    {
      name: "D.O.S.E",
      dev: "Akam AlRajhi",
      km: 168,
      lat: 30.905,
      lng: 28.35,
      zone: "nc3",
    },
    {
      name: "Lasirena North Coast",
      dev: "Lasirena Group",
      km: 171,
      lat: 30.907,
      lng: 28.32,
      zone: "nc3",
    },
    {
      name: "D-Bay",
      dev: "Ora Developers",
      km: 174,
      lat: 30.909,
      lng: 28.29,
      zone: "nc3",
    },
    {
      name: "Soul",
      dev: "Emaar Misr",
      km: 179,
      lat: 31.02,
      lng: 28.26,
      zone: "nc4",
    },
    {
      name: "Katameya Coast",
      dev: "Starlight",
      km: 182,
      lat: 31.044,
      lng: 28.22,
      zone: "nc4",
    },
    {
      name: "Azzar Island",
      dev: "Reedy Group",
      km: 185,
      lat: 31.06,
      lng: 28.19,
      zone: "nc4",
    },
    {
      name: "Jefaira",
      dev: "Inertia",
      km: 188,
      lat: 31.07,
      lng: 28.16,
      zone: "nc4",
    },
    {
      name: "Hacienda Waters",
      dev: "Palm Hills",
      km: 190,
      lat: 31.075,
      lng: 28.14,
      zone: "nc4",
    },
    {
      name: "Cali Coast",
      dev: "Maven",
      km: 193,
      lat: 31.079,
      lng: 28.12,
      zone: "nc4",
    },
    {
      name: "June",
      dev: "Akam Developments",
      km: 196,
      lat: 31.082,
      lng: 28.1,
      zone: "nc4",
    },
    {
      name: "Gaia",
      dev: "Al Ahly Sabbour",
      km: 198,
      lat: 31.084,
      lng: 28.085,
      zone: "nc4",
    },
    {
      name: "Seashell Ras El Hekma",
      dev: "New Giza / Seashell",
      km: 200,
      lat: 31.085,
      lng: 28.07,
      zone: "nc4",
    },
    {
      name: "Swan Lake",
      dev: "Hassan Allam",
      km: 203,
      lat: 31.086,
      lng: 28.05,
      zone: "nc4",
    },
    {
      name: "Mountain View REH",
      dev: "Mountain View (DMG)",
      km: 206,
      lat: 31.0861,
      lng: 28.0273,
      zone: "nc4",
    },
    {
      name: "Caesar Bay",
      dev: "Caesar Bay Mgmt",
      km: 209,
      lat: 31.0867,
      lng: 28.0174,
      zone: "nc4",
    },
    {
      name: "Solare",
      dev: "Misr Italia",
      km: 211,
      lat: 31.0688,
      lng: 28.0369,
      zone: "nc4",
    },
    {
      name: "La Vista Ras El Hekma",
      dev: "La Vista",
      km: 213,
      lat: 31.0906,
      lng: 27.9982,
      zone: "nc4",
    },
    {
      name: "Ogami",
      dev: "SODIC",
      km: 216,
      lat: 31.087,
      lng: 27.9839,
      zone: "nc4",
    },
    {
      name: "Fouka Bay",
      dev: "Tatweer Misr",
      km: 219,
      lat: 31.0948,
      lng: 27.9378,
      zone: "nc4",
    },
    {
      name: "Playa",
      dev: "New Giza / Alchemy",
      km: 221,
      lat: 31.0911,
      lng: 27.9716,
      zone: "nc4",
    },
    {
      name: "Hyde Park (Seashore)",
      dev: "Hyde Park",
      km: 223,
      lat: 31.088,
      lng: 27.9573,
      zone: "nc4",
    },
    {
      name: "Naia Bay",
      dev: "Naia",
      km: 226,
      lat: 31.0977,
      lng: 27.9263,
      zone: "nc5",
    },
    {
      name: "Azha North Coast",
      dev: "Madaar",
      km: 230,
      lat: 31.0992,
      lng: 27.9225,
      zone: "nc5",
    },
    {
      name: "Youd",
      dev: "Al Ahly Sabbour",
      km: 237,
      lat: 31.17,
      lng: 27.85,
      zone: "nc5",
    },
    {
      name: "Ras El Hekma Egypt",
      dev: "ADQ / Modon Holding",
      km: 245,
      lat: 31.165,
      lng: 27.823,
      zone: "nc5",
    },
    {
      name: "Wadi Yemm",
      dev: "Modon",
      km: 248,
      lat: 31.2015,
      lng: 27.8105,
      zone: "nc5",
    },
    {
      name: "Almaza Bay",
      dev: "Travco Properties",
      km: 253,
      lat: 31.1978,
      lng: 27.56,
      zone: "nc5",
    },
    {
      name: "Hacienda Heneish",
      dev: "Palm Hills",
      km: 257,
      lat: 31.1927,
      lng: 27.5827,
      zone: "nc5",
    },
    {
      name: "Silversands",
      dev: "Ora Developers",
      km: 261,
      lat: 31.1875,
      lng: 27.5908,
      zone: "nc5",
    },
    {
      name: "Summer",
      dev: "Al Ahly Sabbour",
      km: 265,
      lat: 31.1945,
      lng: 27.6166,
      zone: "nc5",
    },
    {
      name: "Marsa Baghush",
      dev: "SQM (Shehab Mazhar)",
      km: 269,
      lat: 31.1775,
      lng: 27.6556,
      zone: "nc5",
    },
    {
      name: "Jamila",
      dev: "New Jersey",
      km: 273,
      lat: 31.2124,
      lng: 27.4454,
      zone: "nc5",
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
     DATA — Ain Sokhna (Red Sea)
     ═══════════════════════════════════════════════════════════════ */
  const SK_ZONES = {
    sk1: { name: "Sokhna Coast", color: "#fb923c", km: "km 40–55" },
    sk2: { name: "Galala Mountain", color: "#34d399", km: "km 60–75" },
    sk3: { name: "Porto Zone", color: "#38bdf8", km: "km 76–90" },
    sk4: { name: "Southern Coast", color: "#c084fc", km: "km 90–120" },
  };

  const SK_PROJECTS = [
    {
      name: "Azha",
      dev: "Madaar",
      km: 40,
      lat: 29.721,
      lng: 32.3722,
      zone: "sk1",
    },
    {
      name: "Marina Wadi Degla",
      dev: "Wadi Degla",
      km: 41,
      lat: 29.7208,
      lng: 32.378,
      zone: "sk1",
    },
    {
      name: "Jaz Little Venice",
      dev: "Hassan Allam/Travco",
      km: 43,
      lat: 29.727,
      lng: 32.3746,
      zone: "sk1",
    },
    {
      name: "Ain Bay",
      dev: "G Developments",
      km: 44,
      lat: 29.7289,
      lng: 32.3853,
      zone: "sk1",
    },
    {
      name: "Aroma",
      dev: "Residence RE",
      km: 45,
      lat: 29.7365,
      lng: 32.3913,
      zone: "sk1",
    },
    {
      name: "Blumar El Sokhna",
      dev: "Wadi Degla",
      km: 46,
      lat: 29.7397,
      lng: 32.3975,
      zone: "sk1",
    },
    {
      name: "Stella Di Mare 1",
      dev: "REMCO",
      km: 46,
      lat: 29.6716,
      lng: 32.3576,
      zone: "sk1",
    },
    {
      name: "Stella Di Mare 2",
      dev: "REMCO",
      km: 47,
      lat: 29.6771,
      lng: 32.3455,
      zone: "sk1",
    },
    {
      name: "La Serena Mini Egypt",
      dev: "Lasirena",
      km: 48,
      lat: 29.7529,
      lng: 32.3947,
      zone: "sk1",
    },
    {
      name: "Cape Bay Blumar",
      dev: "Lasirena",
      km: 49,
      lat: 29.7452,
      lng: 32.3945,
      zone: "sk1",
    },
    {
      name: "Palm Beach Ain Sokhna",
      dev: "Lasirena",
      km: 50,
      lat: 29.7424,
      lng: 32.3995,
      zone: "sk1",
    },
    {
      name: "Lugano El Galala",
      dev: "AOG",
      km: 60,
      lat: 29.5557,
      lng: 32.361,
      zone: "sk2",
    },
    {
      name: "Ein Hills",
      dev: "El-Shahawi",
      km: 62,
      lat: 29.5469,
      lng: 32.3668,
      zone: "sk2",
    },
    {
      name: "Il Monte Galala",
      dev: "Tatweer Misr",
      km: 65,
      lat: 29.4999,
      lng: 32.3895,
      zone: "sk2",
    },
    {
      name: "Jebal",
      dev: "PRE",
      km: 66,
      lat: 29.4662,
      lng: 32.4621,
      zone: "sk2",
    },
    {
      name: "Majada",
      dev: "Iwan",
      km: 67,
      lat: 29.4675,
      lng: 32.4554,
      zone: "sk2",
    },
    {
      name: "Carnellia",
      dev: "Ajna",
      km: 68,
      lat: 29.4736,
      lng: 32.4468,
      zone: "sk2",
    },
    {
      name: "Jura",
      dev: "New Jersey",
      km: 68,
      lat: 29.47,
      lng: 32.4556,
      zone: "sk2",
    },
    {
      name: "Baymount",
      dev: "Maven",
      km: 71,
      lat: 29.4896,
      lng: 32.4282,
      zone: "sk2",
    },
    {
      name: "The Groove",
      dev: "DM",
      km: 72,
      lat: 29.4947,
      lng: 32.4243,
      zone: "sk2",
    },
    {
      name: "Galala City",
      dev: "Government/NUCA",
      km: 70,
      lat: 29.4229,
      lng: 32.4142,
      zone: "sk2",
    },
    {
      name: "Sky City",
      dev: "Pyramids",
      km: 76,
      lat: 29.4364,
      lng: 32.4137,
      zone: "sk3",
    },
    {
      name: "Marina Hills",
      dev: "Marina",
      km: 77,
      lat: 29.4419,
      lng: 32.484,
      zone: "sk3",
    },
    {
      name: "Porto Sokhna",
      dev: "Amer Group",
      km: 78,
      lat: 29.4361,
      lng: 32.4829,
      zone: "sk3",
    },
    {
      name: "Dome Marina Resort",
      dev: "Dome Marina",
      km: 79,
      lat: 29.4367,
      lng: 32.4948,
      zone: "sk3",
    },
    {
      name: "Blumar El Dome",
      dev: "Wadi Degla",
      km: 80,
      lat: 29.4402,
      lng: 32.4929,
      zone: "sk3",
    },
    {
      name: "Heaven Hills Porto",
      dev: "ABM Group",
      km: 81,
      lat: 29.4329,
      lng: 32.4751,
      zone: "sk3",
    },
    {
      name: "Covaya",
      dev: "Roya",
      km: 84,
      lat: 29.4038,
      lng: 32.5349,
      zone: "sk3",
    },
    {
      name: "Telal – Shores",
      dev: "Roya / Wadi Degla",
      km: 86,
      lat: 29.4112,
      lng: 32.5237,
      zone: "sk3",
    },
    {
      name: "Murano Wadi Degla",
      dev: "Wadi Degla",
      km: 90,
      lat: 29.5926,
      lng: 32.3407,
      zone: "sk4",
    },
    {
      name: "Palm Hills Sokhna",
      dev: "Palm Hills",
      km: 92,
      lat: 29.3326,
      lng: 32.5929,
      zone: "sk4",
    },
    {
      name: "Laguna Bay",
      dev: "Capital Dev",
      km: 93,
      lat: 29.3367,
      lng: 32.591,
      zone: "sk4",
    },
    {
      name: "Ocean Blue",
      dev: "Sallidar RE",
      km: 95,
      lat: 29.363,
      lng: 32.5743,
      zone: "sk4",
    },
    {
      name: "Piacera",
      dev: "Al Ahly Sabbour",
      km: 97,
      lat: 29.2908,
      lng: 32.6041,
      zone: "sk4",
    },
    {
      name: "Boho El Sokhna",
      dev: "Atric",
      km: 99,
      lat: 29.3087,
      lng: 32.5989,
      zone: "sk4",
    },
    {
      name: "Lasirena Sokhna Resort",
      dev: "Lasirena",
      km: 101,
      lat: 29.279,
      lng: 32.6039,
      zone: "sk4",
    },
    {
      name: "La Vista 4",
      dev: "La Vista",
      km: 106,
      lat: 29.2136,
      lng: 32.6228,
      zone: "sk4",
    },
    {
      name: "La Vista 7",
      dev: "La Vista",
      km: 108,
      lat: 29.231,
      lng: 32.6239,
      zone: "sk4",
    },
    {
      name: "Kai Sokhna",
      dev: "Misr Italia",
      km: 110,
      lat: 29.2084,
      lng: 32.6244,
      zone: "sk4",
    },
    {
      name: "La Vista Ray",
      dev: "La Vista",
      km: 113,
      lat: 29.186,
      lng: 32.6363,
      zone: "sk4",
    },
    {
      name: "Mountain View Sokhna",
      dev: "Mountain View",
      km: 116,
      lat: 29.1834,
      lng: 32.6365,
      zone: "sk4",
    },
    {
      name: "Blue Bay",
      dev: "Marseilia",
      km: 118,
      lat: 29.1906,
      lng: 32.6348,
      zone: "sk4",
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
     PROJECTION — Uniform scaling
     ═══════════════════════════════════════════════════════════════ */
  function makeProjection(projects, svgW, svgH, padX, padY, targetAxis) {
    const usableW = svgW - padX * 2;
    const usableH = svgH - padY * 2;
    const centroid = projects.reduce(
      function (acc, project) {
        acc.lng += project.lng;
        acc.lat += project.lat;
        return acc;
      },
      { lng: 0, lat: 0 },
    );
    centroid.lng /= projects.length;
    centroid.lat /= projects.length;

    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    projects.forEach(function (project) {
      const dx = project.lng - centroid.lng;
      const dy = project.lat - centroid.lat;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    });

    const principalAngle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const rotation =
      targetAxis === "vertical"
        ? Math.PI / 2 - principalAngle
        : -principalAngle;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    function rotatePoint(lat, lng) {
      const dx = lng - centroid.lng;
      const dy = lat - centroid.lat;
      return {
        x: dx * cos - dy * sin,
        y: dx * sin + dy * cos,
      };
    }

    const rotated = projects.map(function (project) {
      return rotatePoint(project.lat, project.lng);
    });
    const xs = rotated.map(function (point) {
      return point.x;
    });
    const ys = rotated.map(function (point) {
      return point.y;
    });
    const minX = Math.min.apply(null, xs);
    const maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    const spanX = Math.max(0.0001, maxX - minX);
    const spanY = Math.max(0.0001, maxY - minY);
    const scale = Math.min(usableW / spanX, usableH / spanY);
    const projW = spanX * scale;
    const projH = spanY * scale;
    const offsetX = padX + (usableW - projW) / 2;
    const offsetY = padY + (usableH - projH) / 2;

    return function project(lat, lng) {
      const rotatedPoint = rotatePoint(lat, lng);
      return {
        x: offsetX + (rotatedPoint.x - minX) * scale,
        y: offsetY + (maxY - rotatedPoint.y) * scale,
      };
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     LABEL LAYOUT — Force-directed orbital positioning
     Robust iterative algorithm with simulated annealing
     ═══════════════════════════════════════════════════════════════ */
  function assignLabelPositions(projects, project, svgW, svgH) {
    const withXY = projects.map(function (p, i) {
      const pt = project(p.lat, p.lng);
      return Object.assign({}, p, { px: pt.x, py: pt.y, idx: i, vx: 0, vy: 0 });
    });

    const LABEL_W = 156;
    const LABEL_H = 40;
    const ORBITAL_RADIUS = 38;
    const MIN_SEPARATION = 64;
    const STEM_LENGTH = 10;
    const SAFETY_MARGIN = 20; // Margin from screen edges

    // Initialize labels at 8 discrete orbital angles around each pin
    const orbitalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    withXY.forEach(function (p, idx) {
      const angleIdx = idx % orbitalAngles.length;
      const angle = (orbitalAngles[angleIdx] * Math.PI) / 180;
      p.angle = angle;
      p.labelX = p.px + ORBITAL_RADIUS * Math.cos(angle) - LABEL_W / 2;
      p.labelY = p.py + ORBITAL_RADIUS * Math.sin(angle) - LABEL_H / 2;
    });

    // Simulated annealing iterations
    const maxIterations = 60;
    let temperature = 1.0;
    const coolingRate = 0.98;

    for (let iter = 0; iter < maxIterations; iter++) {
      temperature *= coolingRate;
      let totalEnergy = 0;

      // Phase 1: Apply repulsive forces from overlapping labels
      for (let i = 0; i < withXY.length; i++) {
        const a = withXY[i];
        const aBox = {
          x1: a.labelX,
          y1: a.labelY,
          x2: a.labelX + LABEL_W,
          y2: a.labelY + LABEL_H,
        };

        for (let j = i + 1; j < withXY.length; j++) {
          const b = withXY[j];
          const bBox = {
            x1: b.labelX,
            y1: b.labelY,
            x2: b.labelX + LABEL_W,
            y2: b.labelY + LABEL_H,
          };

          // AABB overlap detection
          const dx = (aBox.x1 + aBox.x2) / 2 - (bBox.x1 + bBox.x2) / 2;
          const dy = (aBox.y1 + aBox.y2) / 2 - (bBox.y1 + bBox.y2) / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // If overlap exists, apply repulsive force
          if (dist < MIN_SEPARATION) {
            const force = (MIN_SEPARATION - dist) * 0.8 * temperature;
            const fx = (force / (dist + 1)) * dx;
            const fy = (force / (dist + 1)) * dy;

            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;

            totalEnergy += (MIN_SEPARATION - dist) * (MIN_SEPARATION - dist);
          }
        }
      }

      // Phase 2: Apply anchor forces (pull labels back toward orbital positions)
      withXY.forEach(function (p) {
        const targetX = p.px + ORBITAL_RADIUS * Math.cos(p.angle) - LABEL_W / 2;
        const targetY = p.py + ORBITAL_RADIUS * Math.sin(p.angle) - LABEL_H / 2;

        const dx = targetX - p.labelX;
        const dy = targetY - p.labelY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
          const anchorForce = dist * 0.15 * temperature;
          p.vx += (anchorForce / dist) * dx;
          p.vy += (anchorForce / dist) * dy;
        }
      });

      // Phase 3: Apply edge constraints (penalty for escaping screen)
      withXY.forEach(function (p) {
        const edgePenalty = 0.5 * temperature;

        if (p.labelX < SAFETY_MARGIN) {
          p.vx += (SAFETY_MARGIN - p.labelX) * edgePenalty;
        } else if (p.labelX + LABEL_W > svgW - SAFETY_MARGIN) {
          p.vx -= (p.labelX + LABEL_W - (svgW - SAFETY_MARGIN)) * edgePenalty;
        }

        if (p.labelY < SAFETY_MARGIN) {
          p.vy += (SAFETY_MARGIN - p.labelY) * edgePenalty;
        } else if (p.labelY + LABEL_H > svgH - SAFETY_MARGIN) {
          p.vy -= (p.labelY + LABEL_H - (svgH - SAFETY_MARGIN)) * edgePenalty;
        }
      });

      // Phase 4: Update positions via velocity damping
      const damping = 0.85;
      withXY.forEach(function (p) {
        p.vx *= damping;
        p.vy *= damping;
        p.labelX += p.vx;
        p.labelY += p.vy;
      });

      // Early exit if converged
      if (totalEnergy < 50 && iter > 15) break;
    }

    // Final pass: Set stem directions based on final positions
    withXY.forEach(function (p) {
      const labelCenterX = p.labelX + LABEL_W / 2;
      const labelCenterY = p.labelY + LABEL_H / 2;
      const angle = Math.atan2(labelCenterY - p.py, labelCenterX - p.px);

      p.stemX = p.px + STEM_LENGTH * Math.cos(angle);
      p.stemY = p.py + STEM_LENGTH * Math.sin(angle);
      p.side = labelCenterX > p.px ? "right" : "left";
    });

    return withXY;
  }

  /* ═══════════════════════════════════════════════════════════════
     ORGANIC COASTLINE — Natural, flowing bezier curves
     ═══════════════════════════════════════════════════════════════ */
  function buildSmoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1)
      return "M " + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);

    let path = "M " + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
    for (let i = 0; i < points.length - 1; i++) {
      const prev = points[Math.max(0, i - 1)];
      const curr = points[i];
      const next = points[i + 1];
      const after = points[Math.min(points.length - 1, i + 2)];
      const cp1x = curr.x + (next.x - prev.x) / 6;
      const cp1y = curr.y + (next.y - prev.y) / 6;
      const cp2x = next.x - (after.x - curr.x) / 6;
      const cp2y = next.y - (after.y - curr.y) / 6;
      path +=
        " C " +
        cp1x.toFixed(1) +
        " " +
        cp1y.toFixed(1) +
        " " +
        cp2x.toFixed(1) +
        " " +
        cp2y.toFixed(1) +
        " " +
        next.x.toFixed(1) +
        " " +
        next.y.toFixed(1);
    }
    return path;
  }

  function extendPolyline(points, amount) {
    if (points.length < 2) return points.slice();
    const first = points[0];
    const second = points[1];
    const last = points[points.length - 1];
    const beforeLast = points[points.length - 2];
    const startDx = second.x - first.x;
    const startDy = second.y - first.y;
    const startLen = Math.max(
      1,
      Math.sqrt(startDx * startDx + startDy * startDy),
    );
    const endDx = last.x - beforeLast.x;
    const endDy = last.y - beforeLast.y;
    const endLen = Math.max(1, Math.sqrt(endDx * endDx + endDy * endDy));
    const start = {
      x: first.x - (startDx / startLen) * amount,
      y: first.y - (startDy / startLen) * amount,
    };
    const end = {
      x: last.x + (endDx / endLen) * amount,
      y: last.y + (endDy / endLen) * amount,
    };
    return [start].concat(points, [end]);
  }

  function offsetPolyline(points, distanceFn) {
    return points.map(function (point, index) {
      const prev = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const normalX = -dy / len;
      const normalY = dx / len;
      const distance = distanceFn(index, point);
      return {
        x: point.x + normalX * distance,
        y: point.y + normalY * distance,
      };
    });
  }

  function sampleAnchors(points, bucketCount) {
    if (points.length <= bucketCount) return points.slice();
    const anchors = [];
    for (let bucket = 0; bucket < bucketCount; bucket++) {
      const start = Math.floor((bucket / bucketCount) * points.length);
      const end = Math.floor(((bucket + 1) / bucketCount) * points.length);
      const slice = points.slice(start, Math.max(start + 1, end));
      const total = slice.reduce(
        function (acc, point) {
          acc.x += point.x;
          acc.y += point.y;
          return acc;
        },
        { x: 0, y: 0 },
      );
      anchors.push({
        x: total.x / slice.length,
        y: total.y / slice.length,
      });
    }
    anchors[0] = { x: points[0].x, y: points[0].y };
    anchors[anchors.length - 1] = {
      x: points[points.length - 1].x,
      y: points[points.length - 1].y,
    };
    return anchors;
  }

  function smoothAnchors(points, passes) {
    let smoothed = points.slice();
    for (let pass = 0; pass < passes; pass++) {
      smoothed = smoothed.map(function (point, index) {
        if (index === 0 || index === smoothed.length - 1) return point;
        const prev = smoothed[index - 1];
        const next = smoothed[index + 1];
        return {
          x: point.x * 0.5 + (prev.x + next.x) * 0.25,
          y: point.y * 0.5 + (prev.y + next.y) * 0.25,
        };
      });
    }
    return smoothed;
  }

  function buildRibbonPath(edgeA, edgeB) {
    const all = edgeA.concat(edgeB.slice().reverse());
    if (!all.length) return "";
    let path = "M " + all[0].x.toFixed(1) + " " + all[0].y.toFixed(1);
    for (let i = 1; i < all.length; i++) {
      path += " L " + all[i].x.toFixed(1) + " " + all[i].y.toFixed(1);
    }
    return path + " Z";
  }

  function buildCoastalRibbon(anchorPoints, options) {
    const extended = extendPolyline(anchorPoints, options.extension || 90);
    const beachEdge = offsetPolyline(extended, function (index) {
      return (
        options.beachDepth + Math.sin(index * 0.55) * (options.beachWave || 10)
      );
    });
    const inlandEdge = offsetPolyline(extended, function (index) {
      return (
        options.inlandDepth +
        Math.sin(index * 0.42) * (options.inlandWave || 24)
      );
    });
    return {
      coastPoints: extended,
      beachPoints: beachEdge,
      inlandPoints: inlandEdge,
      beachPath: buildRibbonPath(extended, beachEdge),
      landPath: buildRibbonPath(beachEdge, inlandEdge),
      coastPath: buildSmoothPath(extended),
      beachContourPath: buildSmoothPath(beachEdge),
      inlandContourPath: buildSmoothPath(inlandEdge),
    };
  }

  function renderOrganicCoastline(ribbon) {
    let svg = "";
    if (!ribbon || !ribbon.coastPath) return svg;
    svg +=
      '<path d="' +
      ribbon.beachContourPath +
      '" fill="none" stroke="rgba(241,212,165,0.38)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    svg +=
      '<path d="' +
      ribbon.inlandContourPath +
      '" fill="none" stroke="rgba(143,105,57,0.12)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    svg +=
      '<path d="' +
      ribbon.coastPath +
      '" fill="none" stroke="rgba(99,191,255,0.16)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>';
    svg +=
      '<path d="' +
      ribbon.coastPath +
      '" fill="none" stroke="#f0d2a0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>';
    svg +=
      '<path d="' +
      ribbon.coastPath +
      '" fill="none" stroke="#9b6d3c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>';
    return svg;
  }

  /* ═══════════════════════════════════════════════════════════════
     SVG BUILDERS
     ═══════════════════════════════════════════════════════════════ */

  function buildNcSvg() {
    const W = 2400,
      H = 1400;
    const PAD_X = 120,
      PAD_Y = 160;

    const project = makeProjection(
      NC_PROJECTS,
      W,
      H,
      PAD_X,
      PAD_Y,
      "horizontal",
    );
    const labelled = assignLabelPositions(NC_PROJECTS, project, W, H);

    const seaGradId = "seaGradNc";
    const landGradId = "landGradNc";

    let svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" width="' +
      W +
      '" height="' +
      H +
      '">';

    /* Defs */
    svg += "<defs>";
    svg +=
      '<linearGradient id="' + seaGradId + '" x1="0" y1="0" x2="0" y2="1">';
    svg += '<stop offset="0%"   stop-color="#051f3d"/>';
    svg += '<stop offset="40%"  stop-color="#0a2d52"/>';
    svg += '<stop offset="100%" stop-color="#0f3a6b"/>';
    svg += "</linearGradient>";
    svg +=
      '<linearGradient id="' + landGradId + '" x1="0" y1="0" x2="0" y2="1">';
    svg += '<stop offset="0%"   stop-color="#d9ab66"/>';
    svg += '<stop offset="50%"  stop-color="#c9945a"/>';
    svg += '<stop offset="100%" stop-color="#b88549"/>';
    svg += "</linearGradient>";

    // Zone color filters
    Object.keys(NC_ZONES).forEach(function (zid) {
      const col = NC_ZONES[zid].color;
      svg +=
        '<filter id="glow-' +
        zid +
        '" x="-100%" y="-100%" width="300%" height="300%">';
      svg += '<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>';
      svg +=
        '<feFlood flood-color="' + col + '" flood-opacity="0.6" result="f"/>';
      svg += '<feComposite in="f" in2="b" operator="in" result="g"/>';
      svg +=
        '<feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>';
      svg += "</filter>";
    });
    svg += "</defs>";

    /* Full sea background */
    svg +=
      '<rect width="' +
      W +
      '" height="' +
      H +
      '" fill="url(#' +
      seaGradId +
      ')"/>';

    /* Sea wave texture - subtle horizontal lines */
    for (let wy = 50; wy < H * 0.45; wy += 28) {
      svg +=
        '<line x1="0" y1="' +
        wy +
        '" x2="' +
        W +
        '" y2="' +
        wy +
        '" stroke="rgba(255,255,255,0.015)" stroke-width="1"/>';
    }

    /* Prepare coastline points */
    const sortedByX = labelled.slice().sort(function (a, b) {
      return a.px - b.px;
    });
    const ncRawAnchors = sortedByX.map(function (p, index) {
      return {
        x: p.px,
        y: p.py - 34 + Math.sin(index * 0.18) * 5,
      };
    });
    const ncAnchors = smoothAnchors(sampleAnchors(ncRawAnchors, 14), 3);
    const ncRibbon = buildCoastalRibbon(ncAnchors, {
      extension: 120,
      beachDepth: 48,
      beachWave: 6,
      inlandDepth: 210,
      inlandWave: 12,
    });

    svg +=
      '<path d="' +
      ncRibbon.landPath +
      '" fill="url(#' +
      landGradId +
      ')" opacity="0.94"/>';
    svg +=
      '<path d="' +
      ncRibbon.beachPath +
      '" fill="rgba(228,190,132,0.82)" opacity="0.9"/>';
    svg += renderOrganicCoastline(ncRibbon);

    /* Zone color bands */
    const zoneGroups = {};
    labelled.forEach(function (p) {
      if (!zoneGroups[p.zone]) zoneGroups[p.zone] = [];
      zoneGroups[p.zone].push(p);
    });

    Object.keys(zoneGroups).forEach(function (zid) {
      const grp = zoneGroups[zid].slice().sort(function (a, b) {
        return a.px - b.px;
      });
      const col = NC_ZONES[zid].color;
      const x1 = grp[0].px - 20;
      const x2 = grp[grp.length - 1].px + 20;
      svg +=
        '<rect x="' +
        x1.toFixed(0) +
        '" y="' +
        (H - 8) +
        '" width="' +
        (x2 - x1).toFixed(0) +
        '" height="8" fill="' +
        col +
        '" opacity="0.85" rx="2"/>';
      const midX = (x1 + x2) / 2;
      svg +=
        '<text x="' +
        midX.toFixed(0) +
        '" y="' +
        (H - 16) +
        '" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="' +
        col +
        '" letter-spacing="2" opacity="0.85">' +
        esc(NC_ZONES[zid].name.toUpperCase()) +
        "</text>";
      svg +=
        '<text x="' +
        midX.toFixed(0) +
        '" y="' +
        (H - 3) +
        '" text-anchor="middle" font-family="\'Courier New\',monospace" font-size="11" fill="' +
        col +
        '" opacity="0.6">' +
        esc(NC_ZONES[zid].km) +
        "</text>";
    });

    /* Project pins and labels */
    labelled.forEach(function (p) {
      const col = NC_ZONES[p.zone].color;
      const px = p.px;
      const py = p.py;
      const labelX = p.labelX;
      const labelY = p.labelY;
      const stemX = p.stemX;
      const stemY = p.stemY;

      /* Label pill background */
      const pillW = 156;
      const pillH = 40;
      svg +=
        '<rect x="' +
        labelX.toFixed(1) +
        '" y="' +
        labelY.toFixed(1) +
        '" width="' +
        pillW +
        '" height="' +
        pillH +
        '" rx="26" ry="26" fill="rgba(3,15,30,0.75)" opacity="0.92" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';

      /* Label text - simple, clean layout */
      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 14) +
        '" font-family="Inter,sans-serif" font-size="9.5" font-weight="700" fill="#e8f4ff">' +
        esc(p.name) +
        "</text>";
      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 26) +
        '" font-family="Inter,sans-serif" font-size="7.8" fill="' +
        col +
        '" opacity="0.84">' +
        esc(p.dev) +
        "</text>";
      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 36) +
        '" font-family="\'Courier New\',monospace" font-size="7.4" fill="rgba(255,255,255,0.42)">' +
        esc("km " + p.km) +
        "</text>";

      /* Short connector line (7px stem) */
      svg +=
        '<line x1="' +
        px.toFixed(1) +
        '" y1="' +
        py.toFixed(1) +
        '" x2="' +
        stemX.toFixed(1) +
        '" y2="' +
        stemY.toFixed(1) +
        '" stroke="' +
        col +
        '" stroke-width="1.5" opacity="0.65"/>';

      /* Pin head - elegant circle */
      svg +=
        '<circle cx="' +
        px.toFixed(1) +
        '" cy="' +
        py.toFixed(1) +
        '" r="7" fill="' +
        col +
        '" stroke="#04102a" stroke-width="2" filter="url(#glow-' +
        p.zone +
        ')"/>';
      svg +=
        '<circle cx="' +
        px.toFixed(1) +
        '" cy="' +
        py.toFixed(1) +
        '" r="3" fill="#04102a"/>';
    });

    /* Header */
    svg += buildHeaderSvg(
      W,
      "NORTH COAST SAHEL",
      "5 Zones · 65+ Projects · km 100–275",
      "#22d3ee",
    );

    /* Legend */
    svg += buildLegendSvg(W, H, NC_ZONES);

    /* Compass */
    svg += buildCompassSvg(W - 90, 90);

    /* Branding */
    svg += buildBrandingSvg(W, H);

    /* Mediterranean label */
    svg +=
      '<text x="' +
      W / 2 +
      '" y="' +
      PAD_Y * 0.55 +
      '" text-anchor="middle" font-family="\'Playfair Display\',Georgia,serif" font-size="28" font-style="italic" fill="rgba(150,210,255,0.25)" letter-spacing="8" font-weight="300">MEDITERRANEAN  SEA</text>';

    svg += "</svg>";
    return svg;
  }

  function buildSkSvg() {
    const W = 2400,
      H = 1400;
    const PAD_X = 120,
      PAD_Y = 160;

    const project = makeProjection(SK_PROJECTS, W, H, PAD_X, PAD_Y, "vertical");
    const labelled = assignLabelPositions(SK_PROJECTS, project, W, H);

    const seaGradId = "seaGradSk";
    const landGradId = "landGradSk";

    let svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" width="' +
      W +
      '" height="' +
      H +
      '">';

    svg += "<defs>";
    svg +=
      '<linearGradient id="' + seaGradId + '" x1="1" y1="0" x2="0" y2="0">';
    svg += '<stop offset="0%"   stop-color="#041322"/>';
    svg += '<stop offset="60%"  stop-color="#082038"/>';
    svg += '<stop offset="100%" stop-color="#0d2d50"/>';
    svg += "</linearGradient>";
    svg +=
      '<linearGradient id="' + landGradId + '" x1="0" y1="0" x2="1" y2="0">';
    svg += '<stop offset="0%"   stop-color="#b88549"/>';
    svg += '<stop offset="60%"  stop-color="#c9945a"/>';
    svg += '<stop offset="100%" stop-color="#d9ab66"/>';
    svg += "</linearGradient>";

    Object.keys(SK_ZONES).forEach(function (zid) {
      const col = SK_ZONES[zid].color;
      svg +=
        '<filter id="glow-' +
        zid +
        '" x="-100%" y="-100%" width="300%" height="300%">';
      svg += '<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>';
      svg +=
        '<feFlood flood-color="' + col + '" flood-opacity="0.6" result="f"/>';
      svg += '<feComposite in="f" in2="b" operator="in" result="g"/>';
      svg +=
        '<feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>';
      svg += "</filter>";
    });
    svg += "</defs>";

    svg +=
      '<rect width="' +
      W +
      '" height="' +
      H +
      '" fill="url(#' +
      seaGradId +
      ')"/>';

    /* Sea shimmer - vertical for Red Sea */
    for (let wx = W * 0.55; wx < W; wx += 32) {
      svg +=
        '<line x1="' +
        wx +
        '" y1="0" x2="' +
        wx +
        '" y2="' +
        H +
        '" stroke="rgba(255,255,255,0.012)" stroke-width="1"/>';
    }

    const sortedByY = labelled.slice().sort(function (a, b) {
      return a.py - b.py;
    });
    const skRawAnchors = sortedByY.map(function (p, index) {
      return {
        x: p.px + 28 + Math.sin(index * 0.22) * 4,
        y: p.py,
      };
    });
    const skAnchors = smoothAnchors(sampleAnchors(skRawAnchors, 12), 3);
    const skRibbon = buildCoastalRibbon(skAnchors, {
      extension: 110,
      beachDepth: 40,
      beachWave: 5,
      inlandDepth: 168,
      inlandWave: 10,
    });

    svg +=
      '<path d="' +
      skRibbon.landPath +
      '" fill="url(#' +
      landGradId +
      ')" opacity="0.91"/>';
    svg +=
      '<path d="' +
      skRibbon.beachPath +
      '" fill="rgba(230,194,140,0.8)" opacity="0.88"/>';
    svg += renderOrganicCoastline(skRibbon);

    /* Zone bands */
    const zoneGroupsSk = {};
    labelled.forEach(function (p) {
      if (!zoneGroupsSk[p.zone]) zoneGroupsSk[p.zone] = [];
      zoneGroupsSk[p.zone].push(p);
    });
    Object.keys(zoneGroupsSk).forEach(function (zid) {
      const grp = zoneGroupsSk[zid].slice().sort(function (a, b) {
        return a.py - b.py;
      });
      const col = SK_ZONES[zid].color;
      const y1 = grp[0].py - 20;
      const y2 = grp[grp.length - 1].py + 20;
      svg +=
        '<rect x="' +
        (W - 8) +
        '" y="' +
        y1.toFixed(0) +
        '" width="8" height="' +
        (y2 - y1).toFixed(0) +
        '" fill="' +
        col +
        '" opacity="0.85" rx="2"/>';
      const midY = (y1 + y2) / 2;
      svg +=
        '<text x="' +
        (W - 16) +
        '" y="' +
        midY.toFixed(0) +
        '" text-anchor="end" dominant-baseline="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="' +
        col +
        '" letter-spacing="2" opacity="0.85">' +
        esc(SK_ZONES[zid].name.toUpperCase()) +
        "</text>";
    });

    /* Project pins and labels */
    labelled.forEach(function (p) {
      const col = SK_ZONES[p.zone].color;
      const px = p.px;
      const py = p.py;
      const labelX = p.labelX;
      const labelY = p.labelY;
      const stemX = p.stemX;
      const stemY = p.stemY;
      const pillW = 156;
      const pillH = 40;

      svg +=
        '<rect x="' +
        labelX.toFixed(1) +
        '" y="' +
        labelY.toFixed(1) +
        '" width="' +
        pillW +
        '" height="' +
        pillH +
        '" rx="26" ry="26" fill="rgba(3,15,30,0.75)" opacity="0.92" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';

      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 14) +
        '" font-family="Inter,sans-serif" font-size="9.5" font-weight="700" fill="#e8f4ff">' +
        esc(p.name) +
        "</text>";
      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 26) +
        '" font-family="Inter,sans-serif" font-size="7.8" fill="' +
        col +
        '" opacity="0.84">' +
        esc(p.dev) +
        "</text>";
      svg +=
        '<text x="' +
        (labelX + 10) +
        '" y="' +
        (labelY + 36) +
        '" font-family="\'Courier New\',monospace" font-size="7.4" fill="rgba(255,255,255,0.42)">' +
        esc("km " + p.km) +
        "</text>";

      /* Short connector line */
      svg +=
        '<line x1="' +
        px.toFixed(1) +
        '" y1="' +
        py.toFixed(1) +
        '" x2="' +
        stemX.toFixed(1) +
        '" y2="' +
        stemY.toFixed(1) +
        '" stroke="' +
        col +
        '" stroke-width="1.5" opacity="0.65"/>';

      /* Pin head */
      svg +=
        '<circle cx="' +
        px.toFixed(1) +
        '" cy="' +
        py.toFixed(1) +
        '" r="7" fill="' +
        col +
        '" stroke="#030e20" stroke-width="2" filter="url(#glow-' +
        p.zone +
        ')"/>';
      svg +=
        '<circle cx="' +
        px.toFixed(1) +
        '" cy="' +
        py.toFixed(1) +
        '" r="3" fill="#030e20"/>';
    });

    svg +=
      '<text x="' +
      W * 0.82 +
      '" y="' +
      H / 2 +
      '" text-anchor="middle" font-family="\'Playfair Display\',Georgia,serif" font-size="28" font-style="italic" fill="rgba(120,200,255,0.22)" letter-spacing="8" font-weight="300">RED  SEA</text>';

    svg += buildHeaderSvg(
      W,
      "AIN SOKHNA",
      "4 Zones · 44+ Projects · km 40–120",
      "#fb923c",
    );
    svg += buildLegendSvg(W, H, SK_ZONES);
    svg += buildCompassSvg(W - 90, 90);
    svg += buildBrandingSvg(W, H);

    svg += "</svg>";
    return svg;
  }

  function buildHeaderSvg(W, title, sub, accentColor) {
    let s = "";
    s +=
      '<rect x="0" y="0" width="' +
      W +
      '" height="90" fill="rgba(3,10,25,0.88)"/>';
    s +=
      '<rect x="0" y="88" width="' +
      W +
      '" height="2" fill="' +
      accentColor +
      '" opacity="0.6"/>';
    s +=
      '<text x="40" y="56" font-family="\'Playfair Display\',Georgia,serif" font-size="36" font-weight="900" fill="white">Xcelias</text>';
    s +=
      '<text x="152" y="56" font-family="\'Playfair Display\',Georgia,serif" font-size="36" font-weight="900" fill="' +
      accentColor +
      '">·</text>';
    s +=
      '<text x="' +
      W / 2 +
      '" y="38" text-anchor="middle" font-family="\'Playfair Display\',Georgia,serif" font-size="28" font-weight="900" fill="' +
      accentColor +
      '" letter-spacing="3">' +
      esc(title) +
      "</text>";
    s +=
      '<text x="' +
      W / 2 +
      '" y="65" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" fill="rgba(200,220,255,0.6)" letter-spacing="1">' +
      esc(sub) +
      "</text>";
    s +=
      '<text x="' +
      (W - 40) +
      '" y="44" text-anchor="end" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#c9a84c" letter-spacing="2">RED TRAINING ACADEMY</text>';
    s +=
      '<text x="' +
      (W - 40) +
      '" y="62" text-anchor="end" font-family="Inter,sans-serif" font-size="11" fill="rgba(200,220,255,0.45)">CONFIDENTIAL · 2025</text>';
    return s;
  }

  function buildLegendSvg(W, H, zones) {
    const zoneKeys = Object.keys(zones);
    const boxW = 200;
    const boxH = zoneKeys.length * 28 + 36;
    const lx = 40;
    const ly = H - boxH - 20;

    let s = "";
    s +=
      '<rect x="' +
      lx +
      '" y="' +
      ly +
      '" width="' +
      boxW +
      '" height="' +
      boxH +
      '" rx="8" fill="rgba(3,10,25,0.82)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>';
    s +=
      '<text x="' +
      (lx + 12) +
      '" y="' +
      (ly + 22) +
      '" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="rgba(200,220,255,0.5)" letter-spacing="3">ZONES</text>';

    zoneKeys.forEach(function (zid, i) {
      const z = zones[zid];
      const iy = ly + 38 + i * 28;
      s +=
        '<circle cx="' +
        (lx + 18) +
        '" cy="' +
        (iy - 3) +
        '" r="6" fill="' +
        z.color +
        '"/>';
      s +=
        '<text x="' +
        (lx + 32) +
        '" y="' +
        iy +
        '" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#d0e8ff">' +
        esc(z.name) +
        "</text>";
      s +=
        '<text x="' +
        (lx + 32) +
        '" y="' +
        (iy + 12) +
        '" font-family="\'Courier New\',monospace" font-size="10" fill="' +
        z.color +
        '" opacity="0.7">' +
        esc(z.km) +
        "</text>";
    });
    return s;
  }

  function buildCompassSvg(cx, cy) {
    const r = 30;
    let s = "";
    s +=
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      (r + 4) +
      '" fill="rgba(3,10,25,0.7)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>';
    s +=
      '<polygon points="' +
      cx +
      "," +
      (cy - r) +
      " " +
      (cx - 8) +
      "," +
      (cy + 4) +
      " " +
      (cx + 8) +
      "," +
      (cy + 4) +
      '" fill="#c9a84c"/>';
    s +=
      '<polygon points="' +
      cx +
      "," +
      (cy + r) +
      " " +
      (cx - 8) +
      "," +
      (cy - 4) +
      " " +
      (cx + 8) +
      "," +
      (cy - 4) +
      '" fill="rgba(255,255,255,0.2)"/>';
    s +=
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="4" fill="#04102a" stroke="#c9a84c" stroke-width="1.5"/>';
    s +=
      '<text x="' +
      cx +
      '" y="' +
      (cy - r - 6) +
      '" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="#c9a84c">N</text>';
    return s;
  }

  function buildBrandingSvg(W, H) {
    return (
      '<text x="' +
      (W - 40) +
      '" y="' +
      (H - 12) +
      '" text-anchor="end" font-family="\'Playfair Display\',Georgia,serif" font-size="14" fill="rgba(201,168,76,0.35)">xcelias.redtrainingacademy.com</text>'
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT & INIT
     ═══════════════════════════════════════════════════════════════ */
  function getActiveWrap() {
    const ncEl = document.getElementById("mapNc");
    const skEl = document.getElementById("mapSokhna");
    if (ncEl && !ncEl.classList.contains("hidden"))
      return { el: ncEl, name: "north-coast" };
    return { el: skEl, name: "ain-sokhna" };
  }

  function setLoading(on) {
    const v = document.getElementById("loadingVeil");
    if (v) {
      if (on) v.classList.remove("hidden");
      else v.classList.add("hidden");
    }
  }

  function exportPng(wrapEl, filename) {
    setLoading(true);
    const svgEl = wrapEl.querySelector("svg");
    if (!svgEl) {
      setLoading(false);
      return;
    }

    const serialiser = new XMLSerializer();
    const svgStr = serialiser.serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.viewBox.baseVal.width;
      canvas.height = svgEl.viewBox.baseVal.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      setLoading(false);
      const link = document.createElement("a");
      link.download = filename + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      setLoading(false);
      alert("PNG export failed.");
    };
    img.src = url;
  }

  function exportPdf(wrapEl, filename) {
    setLoading(true);
    const svgEl = wrapEl.querySelector("svg");
    if (!svgEl) {
      setLoading(false);
      return;
    }

    const serialiser = new XMLSerializer();
    const svgStr = serialiser.serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function () {
      const W = svgEl.viewBox.baseVal.width;
      const H = svgEl.viewBox.baseVal.height;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const mmW = Math.round(W * 0.2646);
      const mmH = Math.round(H * 0.2646);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: mmW > mmH ? "landscape" : "portrait",
        unit: "mm",
        format: [mmW, mmH],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, mmW, mmH);
      setLoading(false);
      pdf.save(filename + ".pdf");
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      setLoading(false);
      alert("PDF export failed.");
    };
    img.src = url;
  }

  function init() {
    const ncEl = document.getElementById("mapNc");
    const skEl = document.getElementById("mapSokhna");

    if (ncEl) ncEl.innerHTML = buildNcSvg();
    if (skEl) skEl.innerHTML = buildSkSvg();

    document.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const map = btn.getAttribute("data-map");
        if (map === "nc") {
          ncEl.classList.remove("hidden");
          skEl.classList.add("hidden");
        } else {
          skEl.classList.remove("hidden");
          ncEl.classList.add("hidden");
        }
      });
    });

    const btnPdf = document.getElementById("btnPdf");
    const btnPng = document.getElementById("btnPng");

    if (btnPdf) {
      btnPdf.addEventListener("click", function () {
        const a = getActiveWrap();
        exportPdf(a.el, "xcelias-" + a.name + "-map");
      });
    }
    if (btnPng) {
      btnPng.addEventListener("click", function () {
        const a = getActiveWrap();
        exportPng(a.el, "xcelias-" + a.name + "-map");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
