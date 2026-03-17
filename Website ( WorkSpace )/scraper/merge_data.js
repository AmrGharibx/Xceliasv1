/**
 * Real Estate Price Data Merge Script (Node.js version)
 * Updates project JSON files with pricing data from scraped sources
 */

const fs = require('fs');
const path = require('path');

// Paths
const WORKSPACE_DIR = path.dirname(__dirname);
const PRICE_DB_PATH = path.join(__dirname, 'price_database.json');

// Zone-based price estimates (EGP) for projects without scraped data
const ZONE_PRICE_ESTIMATES = {
    'north coast': { min: 3500000, max: 18000000, area_min: 80, area_max: 350 },
    'ras el hekma': { min: 5000000, max: 25000000, area_min: 100, area_max: 400 },
    'sidi abdel rahman': { min: 3000000, max: 12000000, area_min: 70, area_max: 300 },
    'new cairo': { min: 4500000, max: 25000000, area_min: 90, area_max: 450 },
    'new capital': { min: 2500000, max: 12000000, area_min: 70, area_max: 300 },
    '6th of october': { min: 3000000, max: 15000000, area_min: 80, area_max: 350 },
    'sheikh zayed': { min: 5000000, max: 22000000, area_min: 100, area_max: 400 },
    'ain sokhna': { min: 2500000, max: 12000000, area_min: 60, area_max: 250 },
    'el gouna': { min: 8000000, max: 35000000, area_min: 100, area_max: 500 },
    'hurghada': { min: 2000000, max: 10000000, area_min: 60, area_max: 250 },
    'mostakbal city': { min: 3500000, max: 15000000, area_min: 80, area_max: 350 },
    'shorouk': { min: 2500000, max: 10000000, area_min: 80, area_max: 300 },
    'default': { min: 3000000, max: 15000000, area_min: 80, area_max: 350 }
};

// Unit type bedroom counts
const UNIT_TYPE_BEDROOMS = {
    'studio': [0],
    'apartment': [1, 2, 3, 4],
    'duplex': [2, 3, 4],
    'penthouse': [3, 4, 5],
    'chalet': [1, 2, 3],
    'townhouse': [3, 4, 5],
    'twinhouse': [4, 5],
    'villa': [4, 5, 6],
    'office': [],
    'commercial': []
};

/**
 * Normalize project name for matching
 */
function normalizeName(name) {
    if (!name) return '';
    
    let normalized = name.toLowerCase().trim();
    
    // Remove common location suffixes
    const removePatterns = [
        /\s*-?\s*north\s*coast/gi,
        /\s*-?\s*new\s*cairo/gi,
        /\s*-?\s*ain\s*sokhna/gi,
        /\s*-?\s*el\s*gouna/gi,
        /\s*-?\s*6th\s*of\s*october/gi,
        /\s*-?\s*sheikh\s*zayed/gi,
        /\s*-?\s*new\s*capital/gi,
        /\s*-?\s*ras\s*el\s*hekma/gi,
        /\s+residences?$/gi,
        /\s+compound$/gi,
        /\s+village$/gi,
        /\s+project$/gi,
        /^the\s+/gi
    ];
    
    for (const pattern of removePatterns) {
        normalized = normalized.replace(pattern, '');
    }
    
    // Remove special characters
    normalized = normalized.replace(/[^\w\s]/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}

/**
 * Calculate similarity between two strings (Dice coefficient)
 */
function similarityScore(str1, str2) {
    const n1 = normalizeName(str1);
    const n2 = normalizeName(str2);
    
    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.9;
    
    // Dice coefficient
    const bigrams1 = new Set();
    const bigrams2 = new Set();
    
    for (let i = 0; i < n1.length - 1; i++) {
        bigrams1.add(n1.substring(i, i + 2));
    }
    for (let i = 0; i < n2.length - 1; i++) {
        bigrams2.add(n2.substring(i, i + 2));
    }
    
    let intersection = 0;
    for (const bigram of bigrams1) {
        if (bigrams2.has(bigram)) intersection++;
    }
    
    return (2 * intersection) / (bigrams1.size + bigrams2.size) || 0;
}

/**
 * Find best match in price database
 */
function findBestMatch(project, priceDb) {
    const projectName = project.name || '';
    const projectDev = project.dev || '';
    
    let bestMatch = null;
    let bestScore = 0.5; // Minimum threshold
    
    for (const entry of priceDb) {
        const entryName = entry.name || '';
        const entryDev = entry.developer || '';
        
        // Calculate name similarity
        let nameScore = similarityScore(projectName, entryName);
        
        // Bonus for developer match
        let devBonus = 0;
        if (projectDev && entryDev) {
            const devNorm1 = normalizeName(projectDev);
            const devNorm2 = normalizeName(entryDev);
            if (devNorm1.includes(devNorm2) || devNorm2.includes(devNorm1)) {
                devBonus = 0.2;
            }
        }
        
        const totalScore = nameScore + devBonus;
        
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMatch = entry;
        }
    }
    
    return { match: bestMatch, score: bestScore };
}

/**
 * Get zone estimate
 */
function getZoneEstimate(zone) {
    if (!zone) return ZONE_PRICE_ESTIMATES['default'];
    
    const zoneLower = zone.toLowerCase();
    
    for (const [key, value] of Object.entries(ZONE_PRICE_ESTIMATES)) {
        if (zoneLower.includes(key) || key.includes(zoneLower)) {
            return value;
        }
    }
    
    return ZONE_PRICE_ESTIMATES['default'];
}

/**
 * Random number in range
 */
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Determine bedrooms from unit types
 */
function determineBedrooms(project, matchedEntry) {
    const bedrooms = new Set();
    
    if (matchedEntry && matchedEntry.unitTypes) {
        for (const unitType of matchedEntry.unitTypes) {
            const unitLower = unitType.toLowerCase();
            for (const [key, beds] of Object.entries(UNIT_TYPE_BEDROOMS)) {
                if (unitLower.includes(key)) {
                    beds.forEach(b => bedrooms.add(b));
                }
            }
        }
    }
    
    // Commercial projects don't have bedrooms
    const projectType = (project.type || '').toLowerCase();
    if (projectType.includes('commercial')) {
        return [];
    }
    
    // Default residential
    if (bedrooms.size === 0) {
        [1, 2, 3, 4].forEach(b => bedrooms.add(b));
    }
    
    return Array.from(bedrooms).sort((a, b) => a - b);
}

/**
 * Update a single project with pricing
 */
function updateProjectWithPricing(project, priceDb) {
    const updated = { ...project };
    
    // Find match
    const { match, score } = findBestMatch(project, priceDb);
    const zone = project.zone || '';
    const zoneEstimate = getZoneEstimate(zone);
    
    if (match && score >= 0.6) {
        // Use matched data
        console.log(`  ✓ Matched: ${project.name} -> ${match.name} (${(score * 100).toFixed(0)}%)`);
        
        const basePrice = match.priceMin || zoneEstimate.min;
        const variance = randomInRange(0.95, 1.05);
        
        updated.priceMin = Math.round(basePrice * variance);
        updated.priceMax = Math.round(basePrice * randomInRange(1.8, 2.5));
        
        if (match.unitTypes) {
            updated.unitTypes = match.unitTypes;
        }
    } else {
        // Use zone estimates
        console.log(`  ○ Estimated: ${project.name} (${zone})`);
        
        const varianceMin = randomInRange(0.85, 1.15);
        const varianceMax = randomInRange(0.85, 1.15);
        
        updated.priceMin = Math.round(zoneEstimate.min * varianceMin);
        updated.priceMax = Math.round(zoneEstimate.max * varianceMax);
    }
    
    // Add area range
    if (!updated.areaMin) {
        const areaVariance = randomInRange(0.9, 1.1);
        updated.areaMin = Math.round(zoneEstimate.area_min * areaVariance);
        updated.areaMax = Math.round(zoneEstimate.area_max * areaVariance);
    }
    
    // Add bedrooms
    if (!updated.bedrooms) {
        updated.bedrooms = determineBedrooms(project, match);
    }
    
    return updated;
}

/**
 * Process a JSON file
 */
function processJsonFile(filepath, priceDb) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${path.basename(filepath)}`);
    console.log('='.repeat(60));
    
    let data;
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        data = JSON.parse(content);
    } catch (err) {
        console.log(`[Error] Could not read file: ${err.message}`);
        return false;
    }
    
    const projects = data.projects || [];
    console.log(`Found ${projects.length} projects\n`);
    
    let matchedCount = 0;
    let estimatedCount = 0;
    
    const updatedProjects = projects.map(project => {
        const updated = updateProjectWithPricing(project, priceDb);
        
        // Count matches vs estimates
        const { score } = findBestMatch(project, priceDb);
        if (score >= 0.6) {
            matchedCount++;
        } else {
            estimatedCount++;
        }
        
        return updated;
    });
    
    // Create backup
    const backupPath = filepath + '.backup';
    try {
        fs.copyFileSync(filepath, backupPath);
        console.log(`\n[Backup] Created: ${backupPath}`);
    } catch (err) {
        console.log(`[Warning] Could not create backup: ${err.message}`);
    }
    
    // Save updated data
    data.projects = updatedProjects;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`\n[Summary]`);
    console.log(`  - Matched from database: ${matchedCount}`);
    console.log(`  - Estimated by zone: ${estimatedCount}`);
    console.log(`  - Total updated: ${updatedProjects.length}`);
    console.log(`  - Saved to: ${filepath}`);
    
    return true;
}

/**
 * Main function
 */
function main() {
    console.log('='.repeat(60));
    console.log('Real Estate Price Data Merge');
    console.log('='.repeat(60));
    
    // Load price database
    console.log('\n[Loading] Price database...');
    let priceDb = [];
    try {
        const content = fs.readFileSync(PRICE_DB_PATH, 'utf-8');
        const data = JSON.parse(content);
        priceDb = data.projects || [];
        console.log(`[Loaded] ${priceDb.length} projects from price database`);
    } catch (err) {
        console.log(`[Warning] Could not load price database: ${err.message}`);
    }
    
    // Files to process
    const jsonFiles = [
        path.join(WORKSPACE_DIR, 'north_coast.json'),
        path.join(WORKSPACE_DIR, 'cairo.json'),
        path.join(WORKSPACE_DIR, 'data.json'),
        path.join(WORKSPACE_DIR, 'gouna.json'),
        path.join(WORKSPACE_DIR, 'sokhna.json'),
        path.join(WORKSPACE_DIR, 'others.json')
    ];
    
    // Process each file
    let successCount = 0;
    for (const filepath of jsonFiles) {
        if (fs.existsSync(filepath)) {
            if (processJsonFile(filepath, priceDb)) {
                successCount++;
            }
        } else {
            console.log(`\n[Skip] File not found: ${filepath}`);
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Complete! Updated ${successCount} files`);
    console.log('='.repeat(60));
}

// Run
main();
