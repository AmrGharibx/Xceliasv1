const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

const zoneFiles = {
    "North Coast": "north_coast.json",
    "Sokhna": "sokhna.json",
    "Ain Sokhna": "sokhna.json",
    "Galala": "sokhna.json",
    "New Cairo": "cairo.json",
    "New Capital": "cairo.json",
    "6th of October": "cairo.json",
    "October": "cairo.json",
    "Zayed": "cairo.json",
    "Shorouk": "cairo.json",
    "El Gouna": "gouna.json",
    "Gouna": "gouna.json",
    "Somabay": "gouna.json",
    "Red Sea": "gouna.json"
};

const outputData = {
    "north_coast.json": { projects: [], projectDetails: {} },
    "sokhna.json": { projects: [], projectDetails: {} },
    "cairo.json": { projects: [], projectDetails: {} },
    "gouna.json": { projects: [], projectDetails: {} },
    "others.json": { projects: [], projectDetails: {} }
};

data.projects.forEach(p => {
    const zone = p.zone || "Other";
    let targetFile = zoneFiles[zone];
    
    if (!targetFile) {
        // Try partial matches
        if (zone.includes("North") || zone.includes("Sahel")) targetFile = "north_coast.json";
        else if (zone.includes("Sokhna") || zone.includes("Galala")) targetFile = "sokhna.json";
        else if (zone.includes("Gouna") || zone.includes("Red Sea")) targetFile = "gouna.json";
        else if (zone.includes("Cairo") || zone.includes("Capital") || zone.includes("October") || zone.includes("Zayed")) targetFile = "cairo.json";
        else targetFile = "others.json";
    }

    outputData[targetFile].projects.push(p);

    // Copy details if they exist
    if (data.projectDetails && data.projectDetails[p.name]) {
        outputData[targetFile].projectDetails[p.name] = data.projectDetails[p.name];
    }
});

// Write files
Object.keys(outputData).forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, JSON.stringify(outputData[fileName], null, 2));
    console.log(`Created ${fileName} with ${outputData[fileName].projects.length} projects.`);
});
