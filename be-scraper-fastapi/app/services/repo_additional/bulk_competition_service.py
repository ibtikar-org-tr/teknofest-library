"""
Service for bulk creating/updating competitions with multilingual info
"""
from typing import Optional
from app.repositories import d1_competition_crud as competition_crud
from app.services.scrape.competitions import links_service
from app.services.unify.function import find_original_sentence
from app.services.scrape.competitions.scrape import (
    get_competition_name,
    get_competition_description,
    get_competition_image_link, 
    get_competition_application_link)
from app.services.unify.lists import (
    ar_names_list, tr_names_list, en_names_list, 
    tr_links_list, en_links_list, min_members_list, max_members_list,
    tk_number_list, t3kys_number_list
)
from app.models.competition import Competition
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime


def scrape_competition_info(link: str):
    """Scrape competition info from a single link"""
    try:
        if __name__ == "__main__":
            print(f"    Scraping competition info from {link}")

        response = requests.get(link, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        name = get_competition_name(soup)
        description = get_competition_description(soup)
        image_link = get_competition_image_link(soup)
        application_link = get_competition_application_link(soup)
        
        print(f"    Scraped: {name or 'N/A'}")

        if __name__ == "__main__":
            print(f"      Description: {description[:100] + '...' if description else 'N/A'}")
            print(f"      Image Link: {image_link or 'N/A'}")
            print(f"      Application Link: {application_link or 'N/A'}")
        
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


def get_competition_by_link(tr_link: Optional[str] = None, en_link: Optional[str] = None):
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


def find_competition_in_db(tr_name: Optional[str] = None, en_name: Optional[str] = None, ar_name: Optional[str] = None, 
                           tr_link: Optional[str] = None, en_link: Optional[str] = None):
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


def merge_competition_info(idx: int, tr_info: dict, en_info: dict):
    """
    Merge competition info from Turkish and English sources along with predefined list info
    into a single Competition object
    """
    competition = Competition()
    
    # Set competition ID based on priority: tk_number > t3kys_number > random
    competition_id = None
    if idx < len(tk_number_list) and tk_number_list[idx] is not None:
        competition_id = tk_number_list[idx]
    elif idx < len(t3kys_number_list) and t3kys_number_list[idx] is not None:
        competition_id = t3kys_number_list[idx]
    else:
        competition_id = random.randint(100000, 999999)
    
    competition.id = competition_id
    
    # Set tk_number and t3kys_number fields
    if idx < len(tk_number_list) and tk_number_list[idx] is not None:
        competition.tk_number = str(tk_number_list[idx])
    if idx < len(t3kys_number_list) and t3kys_number_list[idx] is not None:
        competition.t3kys_number = str(t3kys_number_list[idx])
    
    # Use predefined info from lists (these are already properly matched by index)
    if idx < len(tr_names_list):
        competition.tr_name = tr_names_list[idx].strip()
    if idx < len(en_names_list):
        competition.en_name = en_names_list[idx].strip()
    if idx < len(ar_names_list):
        competition.ar_name = ar_names_list[idx].strip()
    
    if idx < len(tr_links_list):
        competition.tr_link = f"{tr_links_list[idx].strip()}/"
    if idx < len(en_links_list):
        competition.en_link = f"{en_links_list[idx].strip()}/"
    
    # Set min and max members from CSV if available
    if idx < len(min_members_list) and min_members_list[idx] is not None:
        competition.min_member = min_members_list[idx]
    if idx < len(max_members_list) and max_members_list[idx] is not None:
        competition.max_member = max_members_list[idx]
    
    # Add scraped descriptions if available
    if en_info.get('description'):
        competition.en_description = en_info['description']
    if tr_info.get('description'):
        competition.tr_description = tr_info['description']
    
    # Add scraped application links if available
    if en_info.get('application_link'):
        competition.application_link_en = en_info['application_link']
    if tr_info.get('application_link'):
        competition.application_link_tr = tr_info['application_link']
    
    # Use image from whichever source has it
    if en_info.get('image_link'):
        competition.image_path = en_info['image_link']
    elif tr_info.get('image_link'):
        competition.image_path = tr_info['image_link']
    
    return competition


def get_session_id_for_specific_year(year):
    """Get session cookie for specific year from teknofest.org"""
    try:
        response = requests.get(f"https://teknofest.org/tr/season/{year}")
        session_id = response.cookies.get('sessionid')
        return session_id
    except:
        return None


def bulk_create_update_competitions_from_remote(year: str = None):
    """
    Create or update competitions by scraping links from remote website.
    Only processes TR and EN versions (AR not available on remote).
    
    Args:
        year: Competition year to scrape. If None, uses current year.
    
    Returns a summary of the operation.
    """
    competition_crud_class = competition_crud.CompetitionCRUD()
    
    # Set up year and session
    if year is None:
        year = str(datetime.now().year)
    
    # Get session cookie for specific year
    session_id = get_session_id_for_specific_year(year)
    session_cookies = {'sessionid': session_id} if session_id else None
    
    print(f"\n{'='*60}")
    print(f"Scraping competitions from remote website for year {year}")
    print(f"Session ID: {session_id or 'None (using default)'}")
    print(f"{'='*60}\n")
    
    try:
        # Get links for TR and EN languages from remote website
        print("Fetching Turkish competition links from remote...")
        tr_links = links_service.get_all_links(lang="tr")
        print(f"Found {len(tr_links)} Turkish competition links")
        
        print("Fetching English competition links from remote...")
        en_links = links_service.get_all_links(lang="en")
        print(f"Found {len(en_links)} English competition links")
        
    except Exception as e:
        print(f"Error fetching competition info: {str(e)}")
        return {
            'created': 0,
            'updated': 0,
            'failed': 1,
            'details': [{'error': f'Failed to fetch competition info: {str(e)}'}]
        }
    
    # Match TR and EN competitions by position
    max_competitions = max(len(tr_links), len(en_links))
    
    results = {
        'created': 0,
        'updated': 0,
        'failed': 0,
        'details': []
    }
    
    for idx in range(max_competitions):
        try:
            # Get links for this position
            tr_link = tr_links[idx] if idx < len(tr_links) else None
            en_link = en_links[idx] if idx < len(en_links) else None
            
            # Generate identifier from links
            identifier = en_link or tr_link or f"competition_{idx}"
            
            print(f"\n({idx+1}/{max_competitions}): {identifier}")
            
            # Scrape info from each language version (with session cookie if available)
            if tr_link:
                response = requests.get(tr_link, cookies=session_cookies, timeout=10) if session_cookies else requests.get(tr_link, timeout=10)
                tr_soup = BeautifulSoup(response.content, 'html.parser')
                tr_info = {
                    'name': get_competition_name(tr_soup),
                    'description': get_competition_description(tr_soup),
                    'image_link': get_competition_image_link(tr_soup),
                    'application_link': get_competition_application_link(tr_soup),
                    'link': tr_link
                }
            else:
                tr_info = {}
            
            if en_link:
                response = requests.get(en_link, cookies=session_cookies, timeout=10) if session_cookies else requests.get(en_link, timeout=10)
                en_soup = BeautifulSoup(response.content, 'html.parser')
                en_info = {
                    'name': get_competition_name(en_soup),
                    'description': get_competition_description(en_soup),
                    'image_link': get_competition_image_link(en_soup),
                    'application_link': get_competition_application_link(en_soup),
                    'link': en_link
                }
            else:
                en_info = {}
            
            # Create competition object
            competition = Competition()
            
            # Set names from scraped info
            if tr_info.get('name'):
                competition.tr_name = tr_info['name']
            if en_info.get('name'):
                competition.en_name = en_info['name']
            
            # Set links
            if tr_link:
                competition.tr_link = tr_link
            if en_link:
                competition.en_link = en_link
            
            # Set descriptions
            if tr_info.get('description'):
                competition.tr_description = tr_info['description']
            if en_info.get('description'):
                competition.en_description = en_info['description']
            
            # Set application links
            if tr_info.get('application_link'):
                competition.application_link_tr = tr_info['application_link']
            if en_info.get('application_link'):
                competition.application_link_en = en_info['application_link']
            
            # Set image
            if en_info.get('image_link'):
                competition.image_path = en_info['image_link']
            elif tr_info.get('image_link'):
                competition.image_path = tr_info['image_link']

            # set id
            
            # Add year to years list
            competition.years = [year]
            
            # Check if competition already exists
            existing_competition = find_competition_in_db(
                tr_name=competition.tr_name,
                en_name=competition.en_name,
                tr_link=tr_link,
                en_link=en_link
            )
            
            # Create or update
            if existing_competition:
                print(f"  Found existing competition (ID: {existing_competition.id})")
                # Merge with existing info
                for field in ['tr_name', 'tr_description', 'tr_link', 'en_name', 'en_description', 'en_link',
                              'image_path', 'application_link_tr', 'application_link_en']:
                    new_value = getattr(competition, field)
                    if new_value:
                        setattr(existing_competition, field, new_value)
                
                # Add year to years list if not already present
                if existing_competition.years is None:
                    existing_competition.years = []
                if year not in existing_competition.years:
                    existing_competition.years.append(year)
                
                competition_crud_class.update_competition(existing_competition.id, existing_competition)
                results['updated'] += 1
                results['details'].append({
                    'index': idx,
                    'identifier': identifier,
                    'action': 'updated',
                    'competition_id': existing_competition.id,
                    'en_name': existing_competition.en_name,
                    'tr_name': existing_competition.tr_name
                })
                print(f"  ✓ Updated")
            else:
                print(f"  Creating new competition")
                competition_crud_class.create_competition(competition)
                results['created'] += 1
                results['details'].append({
                    'index': idx,
                    'identifier': identifier,
                    'action': 'created',
                    'en_name': competition.en_name,
                    'tr_name': competition.tr_name
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


def bulk_create_update_competitions_multilingual(source: str = "lists", year: str = None):
    """
    Create or update all competitions in the database with multilingual info.
    
    Args:
        source: 'lists' for local CSV or 'remote' for website scraping
        year: Competition year (used for tracking which years competitions are held)
    
    Returns a summary of the operation.
    """
    if __name__ == "__main__":
        print(f"Running bulk_create_update_competitions_multilingual with source='{source}' and year='{year}'")

    if source == "remote":
        return bulk_create_update_competitions_from_remote(year=year)
    
    # Default: use local lists
    # Set up year
    if year is None:
        year = str(datetime.now().year)
    
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
            # Get info from predefined lists
            tr_name = tr_names_list[idx].strip() if idx < len(tr_names_list) else None
            en_name = en_names_list[idx].strip() if idx < len(en_names_list) else None
            ar_name = ar_names_list[idx].strip() if idx < len(ar_names_list) else None
            tr_link = tr_links_list[idx].strip() if idx < len(tr_links_list) else None
            en_link = en_links_list[idx].strip() if idx < len(en_links_list) else None
            
            # Build full URLs
            tr_url = f"{tr_link}/" if tr_link else None
            en_url = f"{en_link}/" if en_link else None

            if __name__ == "__main__":
                print(f"\nProcessing competition index {idx}:")
                print(f"  TR Name: {tr_name}")
                print(f"  TR Link: {tr_url}")
                print(f"  EN Name: {en_name}")
                print(f"  EN Link: {en_url}")
                print(f"  AR Name: {ar_name}")
            
            # Generate identifier from available names
            identifier = en_name or tr_name or ar_name or f"competition_{idx}"
            
            print(f"\n({idx+1}/{max_competitions}): {identifier}")
            
            # Scrape info from each language version for descriptions and images
            tr_info = scrape_competition_info(tr_url) if tr_url else {}
            en_info = scrape_competition_info(en_url) if en_url else {}
            
            # Merge the info (passing index to use list info)
            competition = merge_competition_info(idx, tr_info, en_info)
            
            # Add year to years list
            competition.years = [year]
            
            # Check if competition already exists using intelligent matching
            # Try links first (most reliable), then fuzzy name matching
            existing_competition = find_competition_in_db(
                tr_name=tr_name, 
                en_name=en_name, 
                ar_name=ar_name,
                tr_link=tr_url,
                en_link=en_url
            )
            
            if __name__ == "__main__":
                if existing_competition:
                    print(f"  Found existing competition in DB (ID: {existing_competition.id})")
                    continue
                else:
                    print(f"  No existing competition found in DB")
                    continue

            # Create or update
            if existing_competition:
                print(f"  Found existing competition (ID: {existing_competition.id})")
                # Merge with existing info, preserving fields not set in new info
                for field in ['tr_name', 'tr_description', 'tr_link', 'en_name', 'en_description', 'en_link', 
                              'ar_name', 'ar_description', 'ar_link', 'image_path', 'min_member', 'max_member',
                              'application_link_tr', 'application_link_en']:
                    new_value = getattr(competition, field)
                    if new_value:
                        setattr(existing_competition, field, new_value)
                
                # Add year to years list if not already present
                if year not in existing_competition.years:
                    existing_competition.years.append(year)
                
                if existing_competition.id is not None:
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

if __name__ == "__main__":
    # Example usage: bulk create/update competitions from lists for current year
    bulk_create_update_competitions_multilingual(source="lists", year="2026")
