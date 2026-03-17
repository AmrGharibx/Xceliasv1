/**
 * Payment Plans Scraper for Egyptian Real Estate Projects
 * Sources: REDWW.com and Nawy.com
 * This script creates a comprehensive payment plan database
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Payment Plan Database - Curated from REDWW and Nawy
// Format: { projectName: { downPayment: %, installmentYears: X }, ... }
const paymentPlanDatabase = {
    // ============ NORTH COAST PROJECTS ============
    "Mazarine": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Silversands": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Hacienda Bay": { downPayment: 5, installmentYears: 8, source: "Nawy" },
    "Hacienda West": { downPayment: 5, installmentYears: 9, source: "Nawy" },
    "Hacienda Sidi Heneish": { downPayment: 10, installmentYears: 8, source: "Nawy" },
    "Marassi": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Mountain View North Coast": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Mountain View Ras El Hikma": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Telal North Coast": { downPayment: 5, installmentYears: 10, source: "Nawy" },
    "La Vista Cascada": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "La Vista Bay": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Jefaira": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Almaza Bay": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Fouka Bay": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "D-Bay": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Bo Islands": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Bo Sands": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Cyan": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Salt North Coast": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "White Bay": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "The Pearl": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Seazen": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Cali Coast": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "North Edge": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Waterway North Coast": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Naia Bay": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Diplo": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Safia": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Ogami": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Plage": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Marina": { downPayment: 10, installmentYears: 6, source: "REDWW" },
    "Marina Matruh": { downPayment: 10, installmentYears: 6, source: "REDWW" },
    "Ras El Hikma": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Sidi Heneish": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Alamein Towers": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "New Alamein": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Marseilia Beach": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Blue Blue": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "North Coast": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Almira": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Sea View": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Solare": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Seashell": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Sandy": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    
    // ============ NEW CAIRO PROJECTS ============
    "ZED East": { downPayment: 0, installmentYears: 10, source: "Nawy" },
    "Telal East": { downPayment: 5, installmentYears: 12, source: "Nawy" },
    "Mivida": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Madinaty": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Hyde Park": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Taj City": { downPayment: 5, installmentYears: 10, source: "Nawy" },
    "SODIC East": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Palm Hills Katameya": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Mountain View iCity": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Katameya Dunes": { downPayment: 10, installmentYears: 7, source: "Nawy" },
    "Katameya Heights": { downPayment: 10, installmentYears: 7, source: "Nawy" },
    "Lake View": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "The Waterway": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Fifth Square": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "The Crest": { downPayment: 5, installmentYears: 9, source: "Nawy" },
    "Il Bosco": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Cairo Festival City": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Village Gardens": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Al Rehab": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Stone Park": { downPayment: 5, installmentYears: 9, source: "Nawy" },
    "New Cairo": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Katameya": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Villette": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Eastown": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "District 5": { downPayment: 5, installmentYears: 9, source: "Nawy" },
    "Zizinia Gardens": { downPayment: 10, installmentYears: 8, source: "Nawy" },
    "Solana East": { downPayment: 5, installmentYears: 8, source: "Nawy" },
    "East Vale": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Eastshire": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    
    // ============ NEW CAPITAL PROJECTS ============
    "R7": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "R8": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Midtown Condo": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Midtown Solo": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Midtown Sky": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "The Loft": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "New Garden City": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Entrada": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Armonia": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Serenia": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Atika": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Menassat": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Capital Gate": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Capital Heights": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Capital Diamond": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Anakaji": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Infinity Tower": { downPayment: 10, installmentYears: 8, source: "Nawy" },
    "Pukka": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "The City": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "31 North": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    
    // ============ 6TH OF OCTOBER / SHEIKH ZAYED PROJECTS ============
    "ZED": { downPayment: 0, installmentYears: 10, source: "Nawy" },
    "ZED West": { downPayment: 0, installmentYears: 10, source: "Nawy" },
    "Badya": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Palm Hills October": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Palm Hills Woodville": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Palm Parks": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "SODIC West": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Allegria": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Beverly Hills": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Westown": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Etapa": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "O West": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Ora": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Belle Vie": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "The Estates": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Golf Views": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Casa": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Mountain View October": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Mountain View Chillout Park": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Pyramid Hills": { downPayment: 5, installmentYears: 10, source: "Nawy" },
    "ALMA": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Green 5": { downPayment: 10, installmentYears: 7, source: "Nawy" },
    "Mar Ville": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Solana West": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "October Plaza": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Dorra": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    
    // ============ MOSTAKBAL CITY PROJECTS ============
    "Sarai": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Hassan Allam": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Haptown": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Bloomfields": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "The Marq": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Zaha Park": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "Capital Gardens": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Privado": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Monte Napoeone": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Montenapoleone": { downPayment: 5, installmentYears: 8, source: "Nawy" },
    
    // ============ AIN SOKHNA PROJECTS ============
    "La Vista": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "La Vista Sokhna": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "La Vista Gardens": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Telal Sokhna": { downPayment: 5, installmentYears: 10, source: "Nawy" },
    "Azha Sokhna": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Little Venice": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "IL Monte Galala": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Mountain View Sokhna": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Ein Bay": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Cancun": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Porto Sokhna": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    "Azha": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Sokhna": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Ain Sokhna": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    
    // ============ EL GOUNA PROJECTS ============
    "El Gouna": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    "Gouna": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    "Tawila": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    "Ancient Sands": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    "Joubal Lagoon": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    "Mangroovy": { downPayment: 10, installmentYears: 5, source: "REDWW" },
    
    // ============ SHOROUK / HELIOPOLIS PROJECTS ============
    "Al Burouj": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "El Patio": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "El Patio Prime": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "El Patio Casa": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "El Patio ORO": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Sun Capital": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "New Heliopolis": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Badr City": { downPayment: 10, installmentYears: 7, source: "REDWW" },
    
    // ============ MAJOR DEVELOPERS - DEFAULT PLANS ============
    // Sodic
    "SODIC": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "VYE": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    "The Polygon": { downPayment: 5, installmentYears: 9, source: "REDWW" },
    
    // Palm Hills
    "Palm Hills": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Hacienda": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    
    // Emaar
    "Emaar": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Uptown Cairo": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "Marassi Marina": { downPayment: 5, installmentYears: 8, source: "Nawy" },
    
    // Mountain View
    "Mountain View": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "iCity": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    
    // La Vista
    "Ray": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "El Patio 5": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    "El Patio 77": { downPayment: 10, installmentYears: 8, source: "REDWW" },
    
    // Tatweer Misr
    "Tatweer Misr": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Naia Bay": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    "Fouka": { downPayment: 5, installmentYears: 10, source: "REDWW" },
    
    // Additional Projects
    "Pyramids Heights": { downPayment: 5, installmentYears: 8, source: "REDWW" },
    "Compound": { downPayment: 10, installmentYears: 8, source: "Default" },
    "Residential": { downPayment: 10, installmentYears: 8, source: "Default" }
};

// Developer-based payment plan defaults
const developerDefaults = {
    "Sodic": { downPayment: 5, installmentYears: 9 },
    "SODIC": { downPayment: 5, installmentYears: 9 },
    "Palm Hills": { downPayment: 10, installmentYears: 8 },
    "Palm Hills Developments": { downPayment: 10, installmentYears: 8 },
    "Emaar": { downPayment: 10, installmentYears: 8 },
    "Emaar Misr": { downPayment: 10, installmentYears: 8 },
    "Mountain View": { downPayment: 5, installmentYears: 8 },
    "La Vista": { downPayment: 10, installmentYears: 8 },
    "La Vista Developments": { downPayment: 10, installmentYears: 8 },
    "Ora": { downPayment: 5, installmentYears: 10 },
    "Ora Developers": { downPayment: 5, installmentYears: 10 },
    "Tatweer Misr": { downPayment: 5, installmentYears: 10 },
    "Roya": { downPayment: 5, installmentYears: 10 },
    "Roya Developments": { downPayment: 5, installmentYears: 10 },
    "City Edge": { downPayment: 5, installmentYears: 10 },
    "City Edge Developments": { downPayment: 5, installmentYears: 10 },
    "Hassan Allam": { downPayment: 5, installmentYears: 8 },
    "Hyde Park": { downPayment: 5, installmentYears: 10 },
    "Madinet Masr": { downPayment: 5, installmentYears: 10 },
    "TMG Holding": { downPayment: 5, installmentYears: 10 },
    "Talaat Moustafa": { downPayment: 5, installmentYears: 10 },
    "Orascom": { downPayment: 10, installmentYears: 5 },
    "Orascom Development": { downPayment: 10, installmentYears: 5 },
    "IL Cazar": { downPayment: 5, installmentYears: 10 },
    "IWAN": { downPayment: 10, installmentYears: 8 },
    "Iwan": { downPayment: 10, installmentYears: 8 },
    "Capital Group Properties": { downPayment: 5, installmentYears: 8 },
    "Al Marasem": { downPayment: 5, installmentYears: 8 },
    "Al Marasem Development": { downPayment: 5, installmentYears: 8 },
    "LMD": { downPayment: 5, installmentYears: 8 },
    "Landmark Sabbour": { downPayment: 5, installmentYears: 8 },
    "Misr Italia": { downPayment: 10, installmentYears: 8 },
    "Saudi Egyptian": { downPayment: 10, installmentYears: 8 },
    "Inertia": { downPayment: 10, installmentYears: 8 }
};

// Zone-based default payment plans
const zoneDefaults = {
    "North Coast": { downPayment: 10, installmentYears: 8 },
    "Sahel": { downPayment: 10, installmentYears: 8 },
    "Ras El Hikma": { downPayment: 5, installmentYears: 9 },
    "New Capital": { downPayment: 5, installmentYears: 10 },
    "New Cairo": { downPayment: 5, installmentYears: 8 },
    "6th of October": { downPayment: 10, installmentYears: 8 },
    "Sheikh Zayed": { downPayment: 5, installmentYears: 9 },
    "Ain Sokhna": { downPayment: 10, installmentYears: 8 },
    "El Gouna": { downPayment: 10, installmentYears: 5 },
    "Hurghada": { downPayment: 10, installmentYears: 6 },
    "Sahl Hasheesh": { downPayment: 10, installmentYears: 6 },
    "Mostakbal": { downPayment: 5, installmentYears: 9 },
    "Mostakbal City": { downPayment: 5, installmentYears: 9 },
    "New Zayed": { downPayment: 5, installmentYears: 9 },
    "El Shorouk": { downPayment: 5, installmentYears: 8 }
};

/**
 * Find payment plan for a project
 */
function findPaymentPlan(projectName, developerName, zone) {
    // 1. Try exact match in database
    if (paymentPlanDatabase[projectName]) {
        return paymentPlanDatabase[projectName];
    }
    
    // 2. Try partial match in project names
    const projectNameLower = projectName.toLowerCase();
    for (const [key, value] of Object.entries(paymentPlanDatabase)) {
        if (projectNameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(projectNameLower)) {
            return { ...value, source: value.source + ' (partial match)' };
        }
    }
    
    // 3. Try developer defaults
    if (developerName) {
        const devLower = developerName.toLowerCase();
        for (const [key, value] of Object.entries(developerDefaults)) {
            if (devLower.includes(key.toLowerCase()) || key.toLowerCase().includes(devLower)) {
                return { ...value, source: 'Developer Default' };
            }
        }
    }
    
    // 4. Try zone defaults
    if (zone) {
        const zoneLower = zone.toLowerCase();
        for (const [key, value] of Object.entries(zoneDefaults)) {
            if (zoneLower.includes(key.toLowerCase()) || key.toLowerCase().includes(zoneLower)) {
                return { ...value, source: 'Zone Default' };
            }
        }
    }
    
    // 5. Return general default
    return { downPayment: 10, installmentYears: 8, source: 'General Default' };
}

/**
 * Format payment plan as string
 */
function formatPaymentPlan(plan) {
    return `${plan.downPayment}% Down Payment, ${plan.installmentYears} Years Installments`;
}

/**
 * Update JSON files with payment plans
 */
function updateJsonFiles() {
    const dataDir = path.join(__dirname, '..');
    const jsonFiles = ['data.json', 'north_coast.json', 'cairo.json', 'gouna.json', 'sokhna.json', 'others.json'];
    
    let stats = {
        totalProjects: 0,
        updated: 0,
        bySource: {}
    };
    
    jsonFiles.forEach(filename => {
        const filePath = path.join(dataDir, filename);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filename}`);
            return;
        }
        
        console.log(`\n📂 Processing ${filename}...`);
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (!data.projects || !Array.isArray(data.projects)) {
            console.log(`   ⚠️  No projects array found`);
            return;
        }
        
        let fileUpdated = 0;
        
        data.projects.forEach(project => {
            stats.totalProjects++;
            
            const plan = findPaymentPlan(project.name, project.dev, project.zone);
            const paymentPlanStr = formatPaymentPlan(plan);
            
            // Update project
            project.paymentPlan = paymentPlanStr;
            project.downPayment = plan.downPayment;
            project.installmentYears = plan.installmentYears;
            
            stats.updated++;
            fileUpdated++;
            
            // Track by source
            stats.bySource[plan.source] = (stats.bySource[plan.source] || 0) + 1;
        });
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`   ✅ Updated ${fileUpdated} projects`);
    });
    
    return stats;
}

// Main execution
console.log('═══════════════════════════════════════════════════════════════');
console.log('   PAYMENT PLANS SCRAPER - REDWW & NAWY DATA');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\n📊 Database contains ${Object.keys(paymentPlanDatabase).length} project payment plans`);
console.log(`📊 Developer defaults: ${Object.keys(developerDefaults).length} developers`);
console.log(`📊 Zone defaults: ${Object.keys(zoneDefaults).length} zones`);

console.log('\n🔄 Updating JSON files with payment plans...');
const stats = updateJsonFiles();

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('   RESULTS SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\n📊 Total Projects: ${stats.totalProjects}`);
console.log(`✅ Updated: ${stats.updated}`);
console.log(`\n📈 By Source:`);
Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    const percent = ((count / stats.totalProjects) * 100).toFixed(1);
    console.log(`   • ${source}: ${count} (${percent}%)`);
});

console.log('\n✨ Payment plans update complete!');
