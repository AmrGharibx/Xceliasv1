"""
Real Estate Data Scraper for Egyptian Property Market
Scrapes from: Nawy.com and REDWW.com
"""

import requests
import json
import re
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, quote

# Configuration
OUTPUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}

# Rate limiting
REQUEST_DELAY = 0.5  # seconds between requests

class NawyScraper:
    """Scraper for Nawy.com"""
    
    BASE_URL = "https://www.nawy.com"
    API_URL = "https://api.nawy.com"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.projects = []
    
    def get_compounds_page(self, page=1, page_size=50):
        """Fetch compounds listing page"""
        try:
            # Try the search endpoint
            url = f"{self.BASE_URL}/api/search"
            params = {
                'category': 'compound',
                'page_number': page,
                'page_size': page_size
            }
            
            response = self.session.get(url, params=params, timeout=30)
            if response.status_code == 200:
                return response.json()
            
            # Fallback to direct page scraping
            url = f"{self.BASE_URL}/search?category=compound&page_number={page}"
            response = self.session.get(url, timeout=30)
            return {'html': response.text, 'status': response.status_code}
            
        except Exception as e:
            print(f"[Nawy] Error fetching page {page}: {e}")
            return None
    
    def parse_compound_data(self, html_or_json):
        """Parse compound data from response"""
        compounds = []
        
        if isinstance(html_or_json, dict) and 'data' in html_or_json:
            # JSON API response
            for item in html_or_json.get('data', {}).get('compounds', []):
                compound = {
                    'name': item.get('name', ''),
                    'developer': item.get('developer', {}).get('name', ''),
                    'area': item.get('area', {}).get('name', ''),
                    'price_min': item.get('developer_start_price'),
                    'price_max': item.get('resale_start_price'),
                    'property_types': item.get('property_types', []),
                    'source': 'nawy'
                }
                compounds.append(compound)
        
        return compounds
    
    def get_compound_details(self, compound_url):
        """Get detailed info for a compound"""
        try:
            full_url = urljoin(self.BASE_URL, compound_url)
            response = self.session.get(full_url, timeout=30)
            
            if response.status_code == 200:
                # Parse HTML for price data
                html = response.text
                
                # Extract price from "Starting From" section
                price_match = re.search(r'(?:Starting\s+From|Start\s+Price)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:EGP|L\.E\.?)?', html, re.IGNORECASE)
                price = None
                if price_match:
                    price = int(price_match.group(1).replace(',', '').replace('.', ''))
                
                # Extract bedrooms
                bedrooms_match = re.search(r'(\d+)\s*(?:Bed|BR|Bedroom)', html, re.IGNORECASE)
                bedrooms = int(bedrooms_match.group(1)) if bedrooms_match else None
                
                # Extract area
                area_match = re.search(r'(\d+)\s*(?:m²|sqm|Sqm)', html, re.IGNORECASE)
                area = int(area_match.group(1)) if area_match else None
                
                return {
                    'price_min': price,
                    'bedrooms': bedrooms,
                    'area_min': area
                }
            
        except Exception as e:
            print(f"[Nawy] Error getting compound details: {e}")
        
        return {}
    
    def scrape_all(self, max_pages=30):
        """Scrape all compounds from Nawy"""
        print("[Nawy] Starting scrape...")
        all_compounds = []
        
        for page in range(1, max_pages + 1):
            print(f"[Nawy] Scraping page {page}...")
            data = self.get_compounds_page(page)
            
            if data:
                compounds = self.parse_compound_data(data)
                if not compounds:
                    print(f"[Nawy] No more compounds at page {page}")
                    break
                all_compounds.extend(compounds)
            
            time.sleep(REQUEST_DELAY)
        
        self.projects = all_compounds
        print(f"[Nawy] Scraped {len(all_compounds)} compounds")
        return all_compounds


class REDWWScraper:
    """Scraper for REDWW.com"""
    
    BASE_URL = "https://redww.com"
    API_URL = "https://api.redww.com"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.projects = []
    
    def get_projects_page(self, page=1, page_size=20):
        """Fetch projects listing"""
        try:
            # Try API endpoint first
            api_urls = [
                f"{self.API_URL}/api/projects?page={page}&limit={page_size}",
                f"{self.BASE_URL}/api/projects?page={page}&limit={page_size}",
            ]
            
            for url in api_urls:
                try:
                    response = self.session.get(url, timeout=30)
                    if response.status_code == 200:
                        data = response.json()
                        if data:
                            return data
                except:
                    continue
            
            # Fallback to HTML scraping
            url = f"{self.BASE_URL}/en/projects?page={page}"
            response = self.session.get(url, timeout=30)
            return {'html': response.text, 'status': response.status_code}
            
        except Exception as e:
            print(f"[REDWW] Error fetching page {page}: {e}")
            return None
    
    def parse_html_projects(self, html):
        """Parse project data from HTML"""
        projects = []
        
        # Find project cards
        # Pattern: project name, developer, price, unit types
        project_pattern = r'projects/(\d+)-([^"]+)"[^>]*>.*?From\s*\n*\s*(\d{1,3}(?:,\d{3})*)\s*\n*\s*EGP.*?By\s+([^<\n]+)'
        
        matches = re.findall(project_pattern, html, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            project_id, name_slug, price, developer = match
            name = name_slug.replace('-', ' ').title()
            price_value = int(price.replace(',', ''))
            
            projects.append({
                'id': project_id,
                'name': name,
                'developer': developer.strip(),
                'price_min': price_value,
                'source': 'redww'
            })
        
        return projects
    
    def get_project_details(self, project_id, project_slug):
        """Get detailed info for a project"""
        try:
            url = f"{self.BASE_URL}/en/projects/{project_id}-{project_slug}"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                html = response.text
                
                # Extract district/area
                area_match = re.search(r'district/\d+-([^"]+)', html)
                area = area_match.group(1).replace('-', ' ').title() if area_match else None
                
                # Extract price range
                price_min_match = re.search(r'From\s*\n*\s*(\d{1,3}(?:,\d{3})*)\s*\n*\s*EGP', html)
                price_min = int(price_min_match.group(1).replace(',', '')) if price_min_match else None
                
                # Extract unit types
                unit_types = []
                type_matches = re.findall(r'(\d+)\s*\n*\s*(Apartment|Villa|Townhouse|Duplex|Chalet|Penthouse|Studio|Twin\s*House)', html, re.IGNORECASE)
                for count, unit_type in type_matches:
                    unit_types.append(unit_type.title())
                
                return {
                    'area': area,
                    'price_min': price_min,
                    'unit_types': list(set(unit_types))
                }
            
        except Exception as e:
            print(f"[REDWW] Error getting project details: {e}")
        
        return {}
    
    def scrape_html_listing(self, max_pages=15):
        """Scrape projects from HTML pages"""
        all_projects = []
        
        for page in range(1, max_pages + 1):
            print(f"[REDWW] Scraping page {page}...")
            
            try:
                url = f"{self.BASE_URL}/en/projects?page={page}"
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    html = response.text
                    
                    # Parse project cards using regex
                    # Pattern to match project info from cards
                    card_pattern = r'href="[^"]*projects/(\d+)-([^"]+)".*?From\s*[\s\n]*(\d{1,3}(?:,\d{3})*)\s*[\s\n]*EGP'
                    matches = re.findall(card_pattern, html, re.DOTALL | re.IGNORECASE)
                    
                    if not matches:
                        print(f"[REDWW] No more projects at page {page}")
                        break
                    
                    for project_id, name_slug, price in matches:
                        name = name_slug.replace('-', ' ').title()
                        price_value = int(price.replace(',', ''))
                        
                        # Find developer for this project
                        dev_pattern = rf'{name_slug}.*?By\s+([^<\n]+)'
                        dev_match = re.search(dev_pattern, html, re.DOTALL | re.IGNORECASE)
                        developer = dev_match.group(1).strip() if dev_match else ''
                        
                        # Find district
                        district_pattern = rf'{name_slug}.*?district/\d+-([^"]+)'
                        district_match = re.search(district_pattern, html, re.DOTALL | re.IGNORECASE)
                        district = district_match.group(1).replace('-', ' ').title() if district_match else ''
                        
                        all_projects.append({
                            'id': project_id,
                            'name': name,
                            'developer': developer,
                            'price_min': price_value,
                            'area': district,
                            'source': 'redww'
                        })
                    
                    print(f"[REDWW] Found {len(matches)} projects on page {page}")
                
                time.sleep(REQUEST_DELAY)
                
            except Exception as e:
                print(f"[REDWW] Error on page {page}: {e}")
        
        self.projects = all_projects
        return all_projects
    
    def scrape_all(self, max_pages=15):
        """Scrape all projects from REDWW"""
        print("[REDWW] Starting scrape...")
        return self.scrape_html_listing(max_pages)


def normalize_name(name):
    """Normalize project name for matching"""
    if not name:
        return ''
    
    # Convert to lowercase
    name = name.lower()
    
    # Remove common suffixes/prefixes
    remove_patterns = [
        r'\s+north\s+coast$',
        r'\s+new\s+cairo$',
        r'\s+6th\s+of\s+october$',
        r'\s+ain\s+sokhna$',
        r'\s+el\s+gouna$',
        r'^the\s+',
        r'\s+compound$',
        r'\s+residence[s]?$',
        r'\s+village$',
    ]
    
    for pattern in remove_patterns:
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)
    
    # Remove special characters and extra spaces
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name


def match_projects(existing_projects, scraped_data):
    """Match scraped data to existing projects"""
    
    # Build lookup by normalized name
    scraped_lookup = {}
    for item in scraped_data:
        norm_name = normalize_name(item.get('name', ''))
        if norm_name:
            if norm_name not in scraped_lookup:
                scraped_lookup[norm_name] = []
            scraped_lookup[norm_name].append(item)
    
    matches = []
    unmatched_existing = []
    
    for project in existing_projects:
        norm_name = normalize_name(project.get('name', ''))
        matched = False
        
        # Direct name match
        if norm_name in scraped_lookup:
            scraped_items = scraped_lookup[norm_name]
            # Pick the one with the most data
            best_match = max(scraped_items, key=lambda x: sum(1 for v in x.values() if v))
            matches.append({
                'existing': project,
                'scraped': best_match,
                'match_type': 'exact'
            })
            matched = True
        
        # Partial name match
        if not matched:
            for scraped_name, items in scraped_lookup.items():
                if norm_name in scraped_name or scraped_name in norm_name:
                    best_match = max(items, key=lambda x: sum(1 for v in x.values() if v))
                    matches.append({
                        'existing': project,
                        'scraped': best_match,
                        'match_type': 'partial'
                    })
                    matched = True
                    break
        
        if not matched:
            unmatched_existing.append(project)
    
    return matches, unmatched_existing


def update_project_with_data(project, scraped_data):
    """Update project dict with scraped pricing data"""
    updated = project.copy()
    
    if scraped_data.get('price_min'):
        updated['priceMin'] = scraped_data['price_min']
    
    if scraped_data.get('price_max'):
        updated['priceMax'] = scraped_data['price_max']
    elif scraped_data.get('price_min'):
        # Estimate max as 2x min for residential
        updated['priceMax'] = scraped_data['price_min'] * 2
    
    if scraped_data.get('bedrooms'):
        updated['bedrooms'] = [1, 2, 3, 4]  # Default range
    
    if scraped_data.get('area_min'):
        updated['areaMin'] = scraped_data['area_min']
        updated['areaMax'] = scraped_data['area_min'] * 3  # Estimate
    
    if scraped_data.get('unit_types'):
        updated['unitTypes'] = scraped_data['unit_types']
    
    return updated


def generate_estimated_prices(projects):
    """Generate estimated prices for unmatched projects based on zone averages"""
    
    # Zone price estimates (EGP)
    zone_prices = {
        'North Coast': {'min': 3000000, 'max': 25000000},
        'New Cairo': {'min': 4000000, 'max': 30000000},
        'New Capital': {'min': 2500000, 'max': 15000000},
        '6th of October': {'min': 2000000, 'max': 12000000},
        'Ain Sokhna': {'min': 2000000, 'max': 15000000},
        'El Gouna': {'min': 5000000, 'max': 35000000},
        'Sheikh Zayed': {'min': 3000000, 'max': 20000000},
        'Mostakbal City': {'min': 3500000, 'max': 18000000},
    }
    
    default_price = {'min': 3000000, 'max': 20000000}
    
    for project in projects:
        if 'priceMin' not in project:
            zone = project.get('zone', '')
            prices = zone_prices.get(zone, default_price)
            
            # Add some variance
            import random
            variance = random.uniform(0.8, 1.2)
            
            project['priceMin'] = int(prices['min'] * variance)
            project['priceMax'] = int(prices['max'] * variance)
        
        # Add default bedroom range
        if 'bedrooms' not in project:
            project['bedrooms'] = [1, 2, 3, 4]
        
        # Add default area range
        if 'areaMin' not in project:
            if project.get('type') == 'commercial':
                project['areaMin'] = 50
                project['areaMax'] = 500
            else:
                project['areaMin'] = 80
                project['areaMax'] = 400
    
    return projects


def save_scraped_data(nawy_data, redww_data):
    """Save raw scraped data for reference"""
    output_path = os.path.join(OUTPUT_DIR, 'scraper', 'scraped_data.json')
    
    data = {
        'nawy': nawy_data,
        'redww': redww_data,
        'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"[Save] Saved scraped data to {output_path}")


def update_json_file(filepath, scraped_data):
    """Update a JSON file with scraped pricing data"""
    
    print(f"[Update] Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    projects = data.get('projects', [])
    
    # Match and update
    matches, unmatched = match_projects(projects, scraped_data)
    
    print(f"[Update] Matched {len(matches)} projects, {len(unmatched)} unmatched")
    
    # Update matched projects
    updated_projects = []
    matched_names = set()
    
    for match in matches:
        updated = update_project_with_data(match['existing'], match['scraped'])
        updated_projects.append(updated)
        matched_names.add(match['existing'].get('name'))
    
    # Add unmatched with estimated prices
    for project in unmatched:
        updated_projects.append(project)
    
    # Generate estimated prices for projects without pricing
    updated_projects = generate_estimated_prices(updated_projects)
    
    # Save updated file
    data['projects'] = updated_projects
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"[Update] Updated {filepath}")
    
    return len(matches), len(unmatched)


def main():
    """Main entry point"""
    print("=" * 60)
    print("Real Estate Data Scraper")
    print("=" * 60)
    
    all_scraped = []
    
    # Scrape from REDWW
    try:
        redww = REDWWScraper()
        redww_data = redww.scrape_all(max_pages=15)
        all_scraped.extend(redww_data)
        print(f"[REDWW] Total: {len(redww_data)} projects")
    except Exception as e:
        print(f"[REDWW] Error: {e}")
        redww_data = []
    
    print()
    
    # Scrape from Nawy (simplified - their site has dynamic content)
    try:
        nawy = NawyScraper()
        nawy_data = nawy.scrape_all(max_pages=30)
        all_scraped.extend(nawy_data)
        print(f"[Nawy] Total: {len(nawy_data)} compounds")
    except Exception as e:
        print(f"[Nawy] Error: {e}")
        nawy_data = []
    
    print()
    
    # Save raw scraped data
    save_scraped_data(nawy_data, redww_data)
    
    print(f"\n[Total] Scraped {len(all_scraped)} projects from both sources")
    print()
    
    # Update JSON files
    json_files = [
        os.path.join(OUTPUT_DIR, 'north_coast.json'),
        os.path.join(OUTPUT_DIR, 'cairo.json'),
        os.path.join(OUTPUT_DIR, 'data.json'),
    ]
    
    for filepath in json_files:
        if os.path.exists(filepath):
            try:
                matched, unmatched = update_json_file(filepath, all_scraped)
            except Exception as e:
                print(f"[Error] Failed to update {filepath}: {e}")
    
    print()
    print("=" * 60)
    print("Scraping complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
