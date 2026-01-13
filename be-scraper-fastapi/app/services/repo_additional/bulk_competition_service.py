"""
Service for bulk creating/updating competitions with multilingual data
"""
from app.repositories import d1_competition_crud as competition_crud
from app.services.scrape.competitions import links_service
from app.services.unify.function import find_original_sentence
from app.services.unify.lists import (
    ar_names_list, tr_names_list, en_names_list, 
    tr_links_list, en_links_list, min_members_list, max_members_list
)
from app.models.competition import Competition
import requests
from bs4 import BeautifulSoup


def get_competition_name(soup):
    """Extract competition name from BeautifulSoup object"""
    try:
        competition_name = soup.find('div', class_='container').find('h1').text.strip()
        return competition_name
    except:
        return None


def get_competition_description(soup):
    """Extract competition description from BeautifulSoup object"""
    try:
        # Get the description from the first tab content
        description = soup.find('div', id='tabsNavigation1').text.strip()
        return description if description else None
    except:
        pass
    return None


def get_competition_image_link(soup):
    """Extract competition image link from BeautifulSoup object"""
    try:
        from urllib.parse import unquote
        image_element = soup.find('div', id='tabsNavigation1').find('img')
        if image_element:
            img_src = image_element.get('src')
            if img_src:
                img_src = unquote(img_src)
                if img_src.startswith('http'):
                    return img_src
                else:
                    return f"https://teknofest.org{img_src}"
    except:
        pass
    return None


def get_competition_application_link(soup):
    """Extract competition application link from BeautifulSoup object"""
    try:
        application_link = soup.find('div', id='tabsNavigation1').find('a')['href']
        return application_link
    except:
        return None


def scrape_competition_data(link: str):
    """Scrape competition data from a single link"""
    try:
        response = requests.get(link, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        name = get_competition_name(soup)
        description = get_competition_description(soup)
        image_link = get_competition_image_link(soup)
        application_link = get_competition_application_link(soup)
        
        print(f"    Scraped: {name or 'N/A'}")
        
        return {
            'name': name,
            'description': description,
            'image_link': image_link,
            'application_link': application_link,
            'link': link
        }
    except requests.exceptions.Timeout:
        print(f"    ⚠ Timeout scraping {link}")
        return {
            'name': None,
            'description': None,
            'image_link': None,
            'application_link': None,
            'link': link
        }
    except requests.exceptions.RequestException as e:
        print(f"    ⚠ Error scraping {link}: {str(e)}")
        return {
            'name': None,
            'description': None,
            'image_link': None,
            'application_link': None,
            'link': link
        }
    except Exception as e:
        print(f"    ⚠ Unexpected error scraping {link}: {str(e)}")
        return {
            'name': None,
            'description': None,
            'image_link': None,
            'application_link': None,
            'link': link
        }


def get_competition_identifier(tr_link: str, en_link: str, ar_link: str):
    """
    Get a unified competition identifier from links.
    Uses the English link name as the primary identifier.
    """
    try:
        if en_link:
            identifier = links_service.get_name_from_link(en_link)
            return identifier
        elif tr_link:
            identifier = links_service.get_name_from_link(tr_link)
            return identifier
        elif ar_link:
            identifier = links_service.get_name_from_link(ar_link)
            return identifier
    except:
        pass
    return None


def get_competition_by_link(tr_link: str = None, en_link: str = None):
    """
    Get competition by TR or EN link from database
    Links are more reliable identifiers than names
    """
    competition_crud_class = competition_crud.CompetitionCRUD()
    
    # Try EN link first (most reliable)
    if en_link:
        sql = "SELECT * FROM competitions WHERE en_link = ? LIMIT 1"
        result = competition_crud_class.client.execute(sql, [en_link])
        if result.get("results") and len(result["results"]) > 0:
            return competition_crud_class._row_to_competition(result["results"][0])
    
    # Try TR link
    if tr_link:
        sql = "SELECT * FROM competitions WHERE tr_link = ? LIMIT 1"
        result = competition_crud_class.client.execute(sql, [tr_link])
        if result.get("results") and len(result["results"]) > 0:
            return competition_crud_class._row_to_competition(result["results"][0])
    
    return None


def find_competition_in_db(tr_name: str = None, en_name: str = None, ar_name: str = None, 
                           tr_link: str = None, en_link: str = None):
    """
    Find competition in database with intelligent matching.
    Uses links first (most reliable), then fuzzy name matching.
    """
    competition_crud_class = competition_crud.CompetitionCRUD()
    
    # 1. Try exact link match (most reliable)
    if en_link:
        existing = get_competition_by_link(en_link=en_link)
        if existing:
            return existing
    
    if tr_link:
        existing = get_competition_by_link(tr_link=tr_link)
        if existing:
            return existing
    
    # 2. Try exact EN name match
    if en_name:
        existing = competition_crud_class.get_competition_by_en_name(en_name)
        if existing:
            return existing
    
    # 3. Try exact TR name match
    if tr_name:
        existing = competition_crud_class.get_competition_by_tr_name(tr_name)
        if existing:
            return existing
    
    # 4. Try fuzzy EN name match using unify function
    if en_name:
        unified_en_name = find_original_sentence(en_name, threshold=0.6)
        if unified_en_name:
            existing = competition_crud_class.get_competition_by_en_name(unified_en_name)
            if existing:
                return existing
    
    # 5. Try fuzzy TR name match using unify function
    if tr_name:
        unified_tr_name = find_original_sentence(tr_name, threshold=0.6)
        if unified_tr_name:
            existing = competition_crud_class.get_competition_by_tr_name(unified_tr_name)
            if existing:
                return existing
    
    # 6. Try AR name match
    if ar_name:
        existing = competition_crud_class.get_competition_by_ar_name(ar_name)
        if existing:
            return existing
    
    return None


def merge_competition_data(idx: int, tr_data: dict, en_data: dict):
    """
    Merge competition data from Turkish and English sources along with predefined list data
    into a single Competition object
    """
    competition = Competition()
    
    # Use predefined data from lists (these are already properly matched by index)
    if idx < len(tr_names_list):
        competition.tr_name = tr_names_list[idx].strip()
    if idx < len(en_names_list):
        competition.en_name = en_names_list[idx].strip()
    if idx < len(ar_names_list):
        competition.ar_name = ar_names_list[idx].strip()
    
    if idx < len(tr_links_list):
        competition.tr_link = f"https://teknofest.org/tr/yarismalar/{tr_links_list[idx].strip()}/"
    if idx < len(en_links_list):
        competition.en_link = f"https://teknofest.org/en/competitions/{en_links_list[idx].strip()}/"
    
    # Set min and max members from CSV if available
    if idx < len(min_members_list) and min_members_list[idx] is not None:
        competition.min_member = min_members_list[idx]
    if idx < len(max_members_list) and max_members_list[idx] is not None:
        competition.max_member = max_members_list[idx]
    
    # Add scraped descriptions if available
    if en_data.get('description'):
        competition.en_description = en_data['description']
    if tr_data.get('description'):
        competition.tr_description = tr_data['description']
    
    # Add scraped application links if available
    if en_data.get('application_link'):
        competition.application_link_en = en_data['application_link']
    if tr_data.get('application_link'):
        competition.application_link_tr = tr_data['application_link']
    
    # Use image from whichever source has it
    if en_data.get('image_link'):
        competition.image_path = en_data['image_link']
    elif tr_data.get('image_link'):
        competition.image_path = tr_data['image_link']
    
    return competition


def bulk_create_update_competitions_multilingual():
    """
    Create or update all competitions in the database with multilingual data.
    
    Uses predefined competition lists (from lists.py) which contain properly matched
    Turkish, English, and Arabic competition names and links.
    
    For each competition:
    - Gets TR/EN/AR names and links from predefined lists
    - Scrapes description and image data from the actual competition pages
    - Merges all data into unified Competition records
    - Updates existing competitions (by link or fuzzy name match) or creates new ones
    
    Returns a summary of the operation.
    """
    competition_crud_class = competition_crud.CompetitionCRUD()
    
    # Use predefined lists which are already matched by index
    max_competitions = max(
        len(tr_names_list), 
        len(en_names_list), 
        len(ar_names_list),
        len(tr_links_list),
        len(en_links_list)
    )
    
    print(f"\nStarting to process {max_competitions} competitions from predefined lists...")
    
    results = {
        'created': 0,
        'updated': 0,
        'failed': 0,
        'details': []
    }
    
    for idx in range(max_competitions):
        try:
            # Get data from predefined lists
            tr_name = tr_names_list[idx].strip() if idx < len(tr_names_list) else None
            en_name = en_names_list[idx].strip() if idx < len(en_names_list) else None
            ar_name = ar_names_list[idx].strip() if idx < len(ar_names_list) else None
            tr_link = tr_links_list[idx].strip() if idx < len(tr_links_list) else None
            en_link = en_links_list[idx].strip() if idx < len(en_links_list) else None
            
            # Build full URLs
            tr_url = f"https://teknofest.org/tr/yarismalar/{tr_link}/" if tr_link else None
            en_url = f"https://teknofest.org/en/competitions/{en_link}/" if en_link else None
            
            # Generate identifier from available names
            identifier = en_name or tr_name or ar_name or f"competition_{idx}"
            
            print(f"\n({idx+1}/{max_competitions}): {identifier}")
            
            # Scrape data from each language version for descriptions and images
            tr_data = scrape_competition_data(tr_url) if tr_url else {}
            en_data = scrape_competition_data(en_url) if en_url else {}
            
            # Merge the data (passing index to use list data)
            competition = merge_competition_data(idx, tr_data, en_data)
            
            # Check if competition already exists using intelligent matching
            # Try links first (most reliable), then fuzzy name matching
            existing_competition = find_competition_in_db(
                tr_name=tr_name, 
                en_name=en_name, 
                ar_name=ar_name,
                tr_link=tr_url,
                en_link=en_url
            )
            
            # Create or update
            if existing_competition:
                print(f"  Found existing competition (ID: {existing_competition.id})")
                # Merge with existing data, preserving fields not set in new data
                for field in ['tr_name', 'tr_description', 'tr_link', 'en_name', 'en_description', 'en_link', 
                              'ar_name', 'ar_description', 'ar_link', 'image_path', 'min_member', 'max_member',
                              'application_link_tr', 'application_link_en']:
                    new_value = getattr(competition, field)
                    if new_value:
                        setattr(existing_competition, field, new_value)
                
                competition_crud_class.update_competition(existing_competition.id, existing_competition)
                results['updated'] += 1
                results['details'].append({
                    'index': idx,
                    'identifier': identifier,
                    'action': 'updated',
                    'competition_id': existing_competition.id,
                    'en_name': existing_competition.en_name,
                    'tr_name': existing_competition.tr_name,
                    'ar_name': existing_competition.ar_name,
                    'min_member': existing_competition.min_member,
                    'max_member': existing_competition.max_member
                })
                print(f"  ✓ Updated")
            else:
                print(f"  Creating new competition")
                # Create new competition
                competition_crud_class.create_competition(competition)
                results['created'] += 1
                results['details'].append({
                    'index': idx,
                    'identifier': identifier,
                    'action': 'created',
                    'en_name': competition.en_name,
                    'tr_name': competition.tr_name,
                    'ar_name': competition.ar_name,
                    'min_member': competition.min_member,
                    'max_member': competition.max_member
                })
                print(f"  ✓ Created")
                
        except Exception as e:
            results['failed'] += 1
            results['details'].append({
                'index': idx,
                'identifier': f"competition_{idx}",
                'action': 'failed',
                'error': str(e)
            })
            print(f"  ✗ Error: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Completed! Created: {results['created']}, Updated: {results['updated']}, Failed: {results['failed']}")
    print(f"{'='*60}\n")
    
    return results
