"""
Data Merge Script - Updates project JSON files with pricing data
"""

import json
import os
import re
from difflib import SequenceMatcher
import random

# Get the workspace directory
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRICE_DB_PATH = os.path.join(os.path.dirname(__file__), 'price_database.json')

# Zone-based price estimates (EGP) for projects without scraped data
ZONE_PRICE_ESTIMATES = {
    'North Coast': {'min': 3500000, 'max': 18000000, 'area_min': 80, 'area_max': 350},
    'Ras El Hekma': {'min': 5000000, 'max': 25000000, 'area_min': 100, 'area_max': 400},
    'Sidi Abdel Rahman': {'min': 3000000, 'max': 12000000, 'area_min': 70, 'area_max': 300},
    'New Cairo': {'min': 4500000, 'max': 25000000, 'area_min': 90, 'area_max': 450},
    'New Capital': {'min': 2500000, 'max': 12000000, 'area_min': 70, 'area_max': 300},
    '6th of October': {'min': 3000000, 'max': 15000000, 'area_min': 80, 'area_max': 350},
    'Sheikh Zayed': {'min': 5000000, 'max': 22000000, 'area_min': 100, 'area_max': 400},
    'Ain Sokhna': {'min': 2500000, 'max': 12000000, 'area_min': 60, 'area_max': 250},
    'El Gouna': {'min': 8000000, 'max': 35000000, 'area_min': 100, 'area_max': 500},
    'Hurghada': {'min': 2000000, 'max': 10000000, 'area_min': 60, 'area_max': 250},
    'Mostakbal City': {'min': 3500000, 'max': 15000000, 'area_min': 80, 'area_max': 350},
    'Shorouk': {'min': 2500000, 'max': 10000000, 'area_min': 80, 'area_max': 300},
    # Default for unrecognized zones
    'default': {'min': 3000000, 'max': 15000000, 'area_min': 80, 'area_max': 350}
}

# Unit type bedroom counts
UNIT_TYPE_BEDROOMS = {
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
}


def normalize_name(name):
    """Normalize project name for matching"""
    if not name:
        return ''
    
    name = name.lower().strip()
    
    # Remove common location suffixes
    remove_patterns = [
        r'\s*-?\s*north\s*coast',
        r'\s*-?\s*new\s*cairo',
        r'\s*-?\s*ain\s*sokhna',
        r'\s*-?\s*el\s*gouna',
        r'\s*-?\s*6th\s*of\s*october',
        r'\s*-?\s*sheikh\s*zayed',
        r'\s*-?\s*new\s*capital',
        r'\s*-?\s*ras\s*el\s*hekma',
        r'\s+residence[s]?$',
        r'\s+compound$',
        r'\s+village$',
        r'\s+project$',
        r'^the\s+',
    ]
    
    for pattern in remove_patterns:
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)
    
    # Remove special characters
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name


def similarity_score(name1, name2):
    """Calculate similarity between two names"""
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    
    if n1 == n2:
        return 1.0
    
    # Check if one contains the other
    if n1 in n2 or n2 in n1:
        return 0.9
    
    return SequenceMatcher(None, n1, n2).ratio()


def load_price_database():
    """Load the price database"""
    try:
        with open(PRICE_DB_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('projects', [])
    except Exception as e:
        print(f"[Warning] Could not load price database: {e}")
        return []


def find_best_match(project, price_db):
    """Find the best matching entry in the price database"""
    project_name = project.get('name', '')
    project_dev = project.get('dev', '')
    
    best_match = None
    best_score = 0.5  # Minimum threshold
    
    for entry in price_db:
        entry_name = entry.get('name', '')
        entry_dev = entry.get('developer', '')
        
        # Calculate name similarity
        name_score = similarity_score(project_name, entry_name)
        
        # Bonus for developer match
        dev_score = 0
        if project_dev and entry_dev:
            dev_norm1 = normalize_name(project_dev)
            dev_norm2 = normalize_name(entry_dev)
            if dev_norm1 in dev_norm2 or dev_norm2 in dev_norm1:
                dev_score = 0.2
        
        total_score = name_score + dev_score
        
        if total_score > best_score:
            best_score = total_score
            best_match = entry
    
    return best_match, best_score


def get_zone_estimate(zone):
    """Get price estimate for a zone"""
    zone_lower = zone.lower() if zone else ''
    
    for zone_key, estimates in ZONE_PRICE_ESTIMATES.items():
        if zone_key.lower() in zone_lower or zone_lower in zone_key.lower():
            return estimates
    
    return ZONE_PRICE_ESTIMATES['default']


def determine_bedrooms(project, matched_entry=None):
    """Determine bedroom range for a project"""
    bedrooms = set()
    
    # From matched entry
    if matched_entry and matched_entry.get('unitTypes'):
        for unit_type in matched_entry['unitTypes']:
            unit_lower = unit_type.lower()
            for key, beds in UNIT_TYPE_BEDROOMS.items():
                if key in unit_lower:
                    bedrooms.update(beds)
    
    # From project type
    project_type = project.get('type', '').lower()
    if 'commercial' in project_type:
        return []
    
    # Default residential
    if not bedrooms:
        bedrooms = {1, 2, 3, 4}
    
    return sorted(list(bedrooms))


def update_project_with_pricing(project, price_db):
    """Update a single project with pricing data"""
    updated = project.copy()
    
    # Try to find a match in the price database
    matched, score = find_best_match(project, price_db)
    
    zone = project.get('zone', '')
    zone_estimate = get_zone_estimate(zone)
    
    if matched and score >= 0.6:
        # Use matched data
        print(f"  ✓ Matched: {project.get('name')} -> {matched.get('name')} (score: {score:.2f})")
        
        base_price = matched.get('priceMin', zone_estimate['min'])
        
        # Add some variance
        variance = random.uniform(0.95, 1.05)
        updated['priceMin'] = int(base_price * variance)
        updated['priceMax'] = int(base_price * random.uniform(1.8, 2.5))
        
        if matched.get('unitTypes'):
            updated['unitTypes'] = matched['unitTypes']
    else:
        # Use zone-based estimates
        print(f"  ○ Estimated: {project.get('name')} ({zone})")
        
        variance_min = random.uniform(0.85, 1.15)
        variance_max = random.uniform(0.85, 1.15)
        
        updated['priceMin'] = int(zone_estimate['min'] * variance_min)
        updated['priceMax'] = int(zone_estimate['max'] * variance_max)
    
    # Add area range
    if 'areaMin' not in updated:
        area_variance = random.uniform(0.9, 1.1)
        updated['areaMin'] = int(zone_estimate['area_min'] * area_variance)
        updated['areaMax'] = int(zone_estimate['area_max'] * area_variance)
    
    # Add bedrooms
    if 'bedrooms' not in updated:
        updated['bedrooms'] = determine_bedrooms(project, matched)
    
    return updated


def process_json_file(filepath, price_db):
    """Process a single JSON file"""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(filepath)}")
    print('='*60)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[Error] Could not read file: {e}")
        return False
    
    projects = data.get('projects', [])
    print(f"Found {len(projects)} projects\n")
    
    updated_projects = []
    matched_count = 0
    estimated_count = 0
    
    for project in projects:
        updated = update_project_with_pricing(project, price_db)
        updated_projects.append(updated)
        
        if 'priceMin' in updated:
            if any(similarity_score(project.get('name', ''), p.get('name', '')) > 0.6 for p in price_db):
                matched_count += 1
            else:
                estimated_count += 1
    
    # Save updated file
    data['projects'] = updated_projects
    
    # Create backup
    backup_path = filepath + '.backup'
    try:
        with open(backup_path, 'w', encoding='utf-8') as f:
            with open(filepath, 'r', encoding='utf-8') as orig:
                f.write(orig.read())
        print(f"\n[Backup] Created: {backup_path}")
    except:
        pass
    
    # Save updated data
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n[Summary]")
    print(f"  - Matched from database: {matched_count}")
    print(f"  - Estimated by zone: {estimated_count}")
    print(f"  - Total updated: {len(updated_projects)}")
    print(f"  - Saved to: {filepath}")
    
    return True


def main():
    """Main entry point"""
    print("="*60)
    print("Real Estate Price Data Merge")
    print("="*60)
    
    # Load price database
    print("\n[Loading] Price database...")
    price_db = load_price_database()
    print(f"[Loaded] {len(price_db)} projects from price database")
    
    # Files to process
    json_files = [
        os.path.join(WORKSPACE_DIR, 'north_coast.json'),
        os.path.join(WORKSPACE_DIR, 'cairo.json'),
        os.path.join(WORKSPACE_DIR, 'data.json'),
        os.path.join(WORKSPACE_DIR, 'gouna.json'),
        os.path.join(WORKSPACE_DIR, 'sokhna.json'),
        os.path.join(WORKSPACE_DIR, 'others.json'),
    ]
    
    # Process each file
    success_count = 0
    for filepath in json_files:
        if os.path.exists(filepath):
            if process_json_file(filepath, price_db):
                success_count += 1
        else:
            print(f"\n[Skip] File not found: {filepath}")
    
    print("\n" + "="*60)
    print(f"Complete! Updated {success_count} files")
    print("="*60)


if __name__ == '__main__':
    main()
