// Import Fuse.js (assuming it's available in the worker scope via importScripts or similar)
// Since we can't easily use importScripts with local files without a server setup that supports it,
// we will assume the user will include the Fuse.js library or we will bundle it.
// However, for a simple worker file in a standard setup:
importScripts('https://cdn.jsdelivr.net/npm/fuse.js@6.6.2');

let fuse;
let projects = [];
let projectDetails = {};
let fuseOptions = {
  keys: ['name', 'dev', 'zone'],
  threshold: 0.3,
  distance: 100
};

self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'INIT') {
        projects = payload.projects || [];
        projectDetails = payload.projectDetails || {};
        try {
            if (typeof Fuse !== 'undefined') {
                fuse = new Fuse(projects, fuseOptions);
            }
        } catch (err) {
            // Fuse init failed — search will fall back to filter-only mode
        }
        self.postMessage({ type: 'INIT_COMPLETE' });
    } else if (type === 'SEARCH') {
        const query = payload.query;
        const results = performSearch(query);
        self.postMessage({ type: 'SEARCH_RESULTS', results: results });
    }
};

function performSearch(query) {
    // If projects is empty, return empty (or should we return all? No, if data isn't loaded, we can't search)
    if (!projects || projects.length === 0) return [];

    let results = projects;

    if (query && query.length > 0) {
        const criteria = parseNaturalLanguageSearch(query);
        
        // Send back detected filters for UI feedback
        self.postMessage({ type: 'DETECTED_FILTERS', filters: criteria.detectedFilters });

        // 1. Filter by Zone
        if (criteria.zone) {
            results = results.filter(p => {
                const z = (p.zone || "").toLowerCase();
                if (criteria.zone === "sokhna") return z.includes("sokhna") || z.includes("galala");
                if (criteria.zone === "north coast") return z.includes("north") || z.includes("ras");
                if (criteria.zone === "gouna") return z.includes("gouna");
                if (criteria.zone === "new capital") return z.includes("capital");
                if (criteria.zone === "october") return z.includes("october") || z.includes("zayed");
                if (criteria.zone === "new cairo") return z.includes("new cairo");
                return false;
            });
        }

        // 2. Filter by Installments
        if (criteria.minInstallments !== null) {
            results = results.filter(p => {
                return p.maxInstallmentYears && p.maxInstallmentYears >= criteria.minInstallments;
            });
        }

        // 3. Filter by Down Payment
        if (criteria.maxDownPayment !== null) {
            results = results.filter(p => {
                return p.minDownPayment !== undefined && p.minDownPayment <= criteria.maxDownPayment;
            });
        }

        // 4. Filter by Area
        if (criteria.minArea !== null) {
            results = results.filter(p => {
                return p.minArea && p.minArea >= criteria.minArea;
            });
        }

        // 5. Filter by Unit Type
        if (criteria.unitType) {
            results = results.filter(p => {
                const details = projectDetails[p.name];
                if (!details || !details.unitTypes) return false;
                return details.unitTypes.toLowerCase().includes(criteria.unitType);
            });
        }

        // 6. Filter by Status
        if (criteria.status) {
            results = results.filter(p => {
                const details = projectDetails[p.name];
                if (!details || !details.status) return false;
                const s = details.status.toLowerCase();
                if (criteria.status === "delivered") return s.includes("delivered") || s.includes("ready");
                if (criteria.status === "construction") return s.includes("construction");
                return false;
            });
        }

        // 7. Filter by Amenities
        if (criteria.amenities.length > 0) {
            results = results.filter(p => {
                const details = projectDetails[p.name];
                if (!details || !details.amenities) return false;
                const am = details.amenities.toLowerCase();
                return criteria.amenities.some(req => am.includes(req));
            });
        }

        // 8. Filter by Developer
        if (criteria.developer) {
            const devQuery = criteria.developer.toLowerCase();
            results = results.filter(p => {
                return p.dev && p.dev.toLowerCase().includes(devQuery);
            });
        }
        
        // 9. Apply Negations (Partial Match)
        if (criteria.negations.length > 0) {
            results = results.filter(p => {
                const details = projectDetails[p.name] || {};
                const fullText = (p.name + " " + p.zone + " " + (details.unitTypes||"") + " " + (details.amenities||"")).toLowerCase();
                return !criteria.negations.some(neg => fullText.includes(neg));
            });
        }

        // 10. Apply Sorting (spread to avoid mutating shared projects array)
        if (criteria.sortBy) {
            results = [...results].sort((a, b) => {
                if (criteria.sortBy === 'installments-desc') {
                    return (b.maxInstallmentYears || 0) - (a.maxInstallmentYears || 0);
                }
                if (criteria.sortBy === 'dp-asc') {
                    const dpA = a.minDownPayment !== undefined ? a.minDownPayment : 999;
                    const dpB = b.minDownPayment !== undefined ? b.minDownPayment : 999;
                    return dpA - dpB;
                }
                if (criteria.sortBy === 'area-desc') {
                    const areaA = a.minArea !== undefined ? a.minArea : 0;
                    const areaB = b.minArea !== undefined ? b.minArea : 0;
                    return areaB - areaA;
                }
                if (criteria.sortBy === 'area-asc') {
                    const areaA = a.minArea !== undefined ? a.minArea : 99999;
                    const areaB = b.minArea !== undefined ? b.minArea : 99999;
                    return areaA - areaB;
                }
                return 0;
            });
        }

        // Fallback: If NO criteria detected but text exists, use Fuse
        if (criteria.detectedFilters.length === 0 && fuse) {
            results = fuse.search(query).map(r => r.item);
        }
        
        // Secondary Fallback: If criteria returned 0 results, try Fuse as backup
        if (results.length === 0 && fuse && query.length > 0) {
            const fuseResults = fuse.search(query).map(r => r.item);
            if (fuseResults.length > 0) {
                results = fuseResults;
            }
        }
    }

    return results;
}

function parseNaturalLanguageSearch(query) {
  const criteria = {
    minInstallments: null,
    maxDownPayment: null,
    minArea: null,
    unitType: null,
    zone: null,
    status: null,
    developer: null,
    amenities: [],
    sortBy: null,
    negations: [],
    text: query,
    detectedFilters: []
  };

  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/).filter(t => t.length > 0);
  const uniqueFilters = new Set();

  // --- 1. PARSE NEGATIONS FIRST ---
  const negationIndices = [];
  tokens.forEach((t, i) => {
      if (["no", "not", "except"].includes(t) && i + 1 < tokens.length) {
          const negatedTerm = tokens[i+1];
          criteria.negations.push(negatedTerm);
          uniqueFilters.add(`Exclude: ${negatedTerm}`);
          negationIndices.push(i, i+1);
      }
  });

  const positiveTokens = tokens.filter((_, i) => !negationIndices.includes(i));
  const positiveQuery = positiveTokens.join(" ");

  // --- 2. PARTIAL NUMBER PARSING ---
  const yearsMatch = positiveQuery.match(/(\d+)\s*y/); 
  if (yearsMatch) {
    criteria.minInstallments = parseInt(yearsMatch[1], 10);
    uniqueFilters.add(`${criteria.minInstallments}+ Years`);
  }

  const dpMatch = positiveQuery.match(/(\d+)\s*%\s*(?:down|dp|payment|d)?|(\d+)\s*(?:dp|down\s*payment|down)/i);
  if (dpMatch) {
      const val = parseInt(dpMatch[1] || dpMatch[2], 10);
      if (val <= 60) {
          criteria.maxDownPayment = val;
          uniqueFilters.add(`Max ${val}% DP`);
      }
  }

  const areaMatch = positiveQuery.match(/(\d+)\s*m|(\d+)\s*sq/);
  if (areaMatch) {
      criteria.minArea = parseInt(areaMatch[1] || areaMatch[2], 10);
      uniqueFilters.add(`Min ${criteria.minArea}m²`);
  } else {
      const standaloneNum = positiveQuery.match(/\b(\d{3,})\b/);
      if (standaloneNum) {
           criteria.minArea = parseInt(standaloneNum[1], 10);
           uniqueFilters.add(`Min ${criteria.minArea}m²`);
      }
  }

  // --- 3. PARTIAL KEYWORD MATCHING ---
  positiveTokens.forEach(t => {
      if (t.length < 3) return;

      if ("chalet".startsWith(t)) { criteria.unitType = "chalet"; uniqueFilters.add("Chalets"); }
      else if ("villa".startsWith(t) || "stand".startsWith(t)) { criteria.unitType = "villa"; uniqueFilters.add("Villas"); }
      else if ("apartment".startsWith(t) || "flat".startsWith(t) || "condo".startsWith(t)) { criteria.unitType = "apartment"; uniqueFilters.add("Apartments"); }
      else if ("townhouse".startsWith(t)) { criteria.unitType = "townhouse"; uniqueFilters.add("Townhouses"); }
      else if ("twin".startsWith(t)) { criteria.unitType = "twin"; uniqueFilters.add("Twin Houses"); }
      else if ("duplex".startsWith(t)) { criteria.unitType = "duplex"; uniqueFilters.add("Duplexes"); }
      else if ("studio".startsWith(t)) { criteria.unitType = "studio"; uniqueFilters.add("Studios"); }
      else if ("commercial".startsWith(t) || "retail".startsWith(t) || "mall".startsWith(t)) { criteria.unitType = "commercial"; uniqueFilters.add("Commercial"); }
      else if ("office".startsWith(t) || "admin".startsWith(t)) { criteria.unitType = "office"; uniqueFilters.add("Offices"); }
      else if ("clinic".startsWith(t) || "medical".startsWith(t)) { criteria.unitType = "clinic"; uniqueFilters.add("Clinics"); }
      else if ("cabin".startsWith(t)) { criteria.unitType = "cabin"; uniqueFilters.add("Cabins"); }
      else if ("penthouse".startsWith(t) || "roof".startsWith(t)) { criteria.unitType = "penthouse"; uniqueFilters.add("Penthouses"); }

      if ("north".startsWith(t) || "sahel".startsWith(t) || "alamein".startsWith(t) || "ras".startsWith(t)) { 
          criteria.zone = "north coast"; 
          uniqueFilters.add("North Coast"); 
      }
      else if ("sokhna".startsWith(t) || "galala".startsWith(t) || "red".startsWith(t)) { 
          criteria.zone = "sokhna"; 
          uniqueFilters.add("Ain Sokhna"); 
      }
      else if ("gouna".startsWith(t)) { 
          criteria.zone = "gouna"; 
          uniqueFilters.add("El Gouna"); 
      }
      else if ("capital".startsWith(t) || "administrative".startsWith(t)) { 
          criteria.zone = "new capital"; 
          uniqueFilters.add("New Capital"); 
      }
      else if ("october".startsWith(t) || "zayed".startsWith(t) || "sheikh".startsWith(t) || "west".startsWith(t) || "pyramids".startsWith(t)) { 
          criteria.zone = "october"; 
          uniqueFilters.add("6th of October"); 
      }
      else if ("cairo".startsWith(t) || "tagamoa".startsWith(t) || "fifth".startsWith(t)) { 
          criteria.zone = "new cairo"; 
          uniqueFilters.add("New Cairo"); 
      }

      if ("ready".startsWith(t) || "delivered".startsWith(t) || "move".startsWith(t)) { 
          criteria.status = "delivered"; 
          uniqueFilters.add("Ready to Move"); 
      }
      else if ("construction".startsWith(t) || "under".startsWith(t)) { 
          criteria.status = "construction"; 
          uniqueFilters.add("Under Construction"); 
      }

      if ("lagoon".startsWith(t)) { criteria.amenities.push("lagoon"); uniqueFilters.add("Lagoon"); }
      if ("sea".startsWith(t) || "view".startsWith(t)) { criteria.amenities.push("sea view"); uniqueFilters.add("Sea View"); }
      if ("pool".startsWith(t)) { criteria.amenities.push("pool"); uniqueFilters.add("Pool"); }
      if ("golf".startsWith(t)) { criteria.amenities.push("golf"); uniqueFilters.add("Golf"); }
  });

  const byIndex = positiveTokens.indexOf("by");
  if (byIndex !== -1 && byIndex + 1 < positiveTokens.length) {
      const devName = positiveTokens[byIndex + 1];
      criteria.developer = devName;
      uniqueFilters.add(`Dev: ${devName}`);
  }

  if (positiveQuery.includes("sort") || positiveQuery.includes("order") || positiveQuery.includes("most") || positiveQuery.includes("least")) {
       if (positiveQuery.includes("install") || positiveQuery.includes("pay")) criteria.sortBy = 'installments-desc';
       if (positiveQuery.includes("price") || positiveQuery.includes("cheap") || positiveQuery.includes("low")) criteria.sortBy = 'dp-asc';
       if (positiveQuery.includes("area") || positiveQuery.includes("big") || positiveQuery.includes("large")) criteria.sortBy = 'area-desc';
       if (positiveQuery.includes("small")) criteria.sortBy = 'area-asc';
  }

  criteria.detectedFilters = Array.from(uniqueFilters);
  return criteria;
}
