import os
import requests
from urllib.parse import urlparse, unquote, urljoin
from bs4 import BeautifulSoup
from app.services import download
from app.services.unify.function import find_original_sentence
from app.services.repo_additional import team_crud_services
from app.services.scrape.competitions.scrape import get_session_id_for_specific_year
from app.services.filename_utils import sanitize_filename
from datetime import datetime
from app.initializers import env

def build_bucket_link(local_path: str):
    """Return public bucket URL for a local download path when BUCKET_LINK is set."""
    bucket_link = env.BUCKET_LINK
    if not bucket_link or not local_path:
        return local_path

    bucket_link = bucket_link.rstrip("/")
    try:
        rel_path = os.path.relpath(local_path, start=os.getcwd())
    except ValueError:
        return local_path

    rel_path = rel_path.replace(os.sep, "/")
    return f"{bucket_link}/{rel_path}"

def scrape_page(page, update_downloads: bool = False, update_database: bool = False, year=None, session_id=None):
    stats = {
        "teams_retrieved": 0,
        "reports_downloaded": 0,
        "intros_downloaded": 0,
        "database_updates": 0,
        "errors": 0
    }
    
    try:
        # set session_id if year is specified and session_id is not provided
        if session_id:
            pass  # Use provided session_id
        elif year:
            session_id = get_session_id_for_specific_year(year)
            if not session_id:
                print(f"Failed to get session ID for year {year}")
                return stats
        else:
            year = str(datetime.now().year)
        
        link = f"https://teknofest.org/tr/yarismalar/competition_report/?page={page}"
        
        # Make request with session_id if available
        if session_id:
            response0 = requests.get(link, cookies={'sessionid': session_id})
        else:
            response0 = requests.get(link)
        
        response0.raise_for_status()
        content0 = response0.text
        soup0 = BeautifulSoup(content0, 'html.parser')
        the_table0 = soup0.find('tbody', id="myTable")

        if the_table0:
            for tr in the_table0.find_all('tr'):
                try:
                    comp_name = tr.find('th').find('a').text.strip()
                    comp_name = find_original_sentence(comp_name)
                    team_name = tr.find_all('td')[0].find('a').text.strip()
                    year = tr.find_all('td')[1].text.strip()
                    
                    # Sanitize names for file paths
                    safe_comp_name = sanitize_filename(str(comp_name))
                    safe_team_name = sanitize_filename(team_name)
                    
                    stats["teams_retrieved"] += 1

                    folder_path = os.path.join(os.getcwd(), "competitions", safe_comp_name, "teams", str(year))
                    os.makedirs(folder_path, exist_ok=True)

                    full_report_file_path = None
                    full_intro_file_path = None

                    # # download report file if exists
                    # try:
                    #     report_link_raw = tr.find_all('td')[2].find('a')['href']
                    #     report_link = urljoin("https://teknofest.org", report_link_raw)
                    #     base_file_name = unquote(os.path.basename(urlparse(report_link).path))
                    #     prefixed_file_name = f"{team_name}_{base_file_name}"
                    #     full_report_file_path = os.path.join(folder_path, prefixed_file_name)
                    #     if update_downloads:
                    #         download.download_file(report_link, full_report_file_path)
                    #         stats["reports_downloaded"] += 1
                    # except:
                    #     print(f"report failed for {team_name}")
                    #     stats["errors"] += 1

                    # download team intro page as html file
                    team_link = None
                    try:
                        team_link_relative = tr.find_all('td')[2].find('a')['href']
                        team_link = urljoin("https://teknofest.org", team_link_relative)
                        full_intro_file_path = os.path.join(folder_path, f"{safe_team_name}_intro.html")
                        if update_downloads:
                            download.download_file(team_link, full_intro_file_path)
                            stats["intros_downloaded"] += 1
                    except:
                        print(f"team file failed for {team_name}")
                        stats["errors"] += 1

                    if update_database and team_link:
                        team_name, team_members_list, team_info, institution_name = scrape_team_page(team_link)
                        report_storage_path = build_bucket_link(full_report_file_path)
                        intro_storage_path = build_bucket_link(full_intro_file_path)
                        team_crud_services.update_or_create_team(
                            name=team_name,
                            members_list=team_members_list,
                            description=team_info,
                            institution_name=institution_name,
                            comp_name=comp_name,
                            year=year,
                            report_file_path=report_storage_path,
                            intro_file_path=intro_storage_path,
                            team_link=team_link,
                            status="finalist"
                            )
                        stats["database_updates"] += 1
                    
                except (AttributeError, IndexError, KeyError) as e:
                    print(f"Skipping a row due to missing data: {e}")
                    stats["errors"] += 1
                    continue
        else:
            print("The specified element was not found.")
    except requests.exceptions.RequestException as e:
        print(f"Error while fetching the page: {e}")
        stats["errors"] += 1
    
    return stats

def scrape_team_page(team_link):
    try:
        team_page = requests.get(team_link)
        team_page.encoding = team_page.apparent_encoding
        team_page.raise_for_status()
        team_page_soup = BeautifulSoup(team_page.text, 'html.parser')

        # team name
        h1_element = team_page_soup.find('h1')
        team_name = h1_element.text.strip() if h1_element else None

        # team members list
        team_members_list = []
        members_row = team_page_soup.find('div', class_='report-team')
        if members_row:
            for member_element in members_row.find_all('p'):
                member_name = member_element.get_text(strip=True)
                member_name = member_name.encode('utf-8').decode('utf-8') # TODO not encoding properly
                team_members_list.append(member_name)

        # team info
        team_info_div = team_page_soup.find('div', class_='team-info')
        team_info = None
        if team_info_div:
            team_info_h6 = team_info_div.find('h6')
            if team_info_h6:
                team_info_h6.extract()
            team_info = team_info_div.text.strip()

        school_element = team_page_soup.find('p', class_='school')
        institution_name = school_element.text.strip() if school_element else None

        return team_name, team_members_list, team_info, institution_name
    except requests.exceptions.RequestException as e:
        print(f"Error while fetching the page: {e}")
        return None, None, None, None
    


