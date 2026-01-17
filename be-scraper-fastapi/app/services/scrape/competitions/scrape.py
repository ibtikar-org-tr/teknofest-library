import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote
import os
from app.services import download
from app.services.scrape.competitions import links_service
from app.services.unify.function import find_original_sentence
from app.services.filename_utils import sanitize_filename
from datetime import datetime
from app.services.repo_additional import competition_crud_services

def scrape_link(link, check_prev_year_reports: bool = False, update_downloads: bool = False, update_database: bool = False, year=None, session_id=None):
    # Initialize counters
    files_downloaded = 0
    fields_updated = 0
    status_message = ""
    updated_competition_data = False
    if __name__ == "__main__": print(f"Scraping link: {link} for year: {year}")
    
    # set session_id if year is specified and session_id is not provided
    if session_id:
        response = requests.get(link, cookies={'sessionid': session_id})
    elif year:
        session_id = get_session_id_for_specific_year(year)
        if session_id:
            response = requests.get(link, cookies={'sessionid': session_id})
            if __name__ == "__main__": print(f"Using session_id: {session_id} for year: {year}")
        else:
            return 500, {"status": "ERROR", "files_downloaded": 0, "fields_updated": 0, "message": "Failed to get session ID"}
    else:
        response = requests.get(link)
        year = str(datetime.now().year)
    
    content = response.content.decode('utf-8')
    soup = BeautifulSoup(content, 'html.parser')
    tabs_in_the_page = soup.find_all('div', class_="tab-pane tab-pane-navigation")
    if __name__ == "__main__": print(f"Page language: {get_page_lang(response)}")
    if __name__ == "__main__": print(f"Found {len(tabs_in_the_page)} tabs in the page.")
    # if __name__ == "__main__": print(f"tabs_in_the_page: {tabs_in_the_page}")

    # reports
    if check_prev_year_reports:
        if tabs_in_the_page:
            for tab in tabs_in_the_page:
                if __name__ == "__main__": print(f"Processing tab with id: {tab.get('id')}")
                if tab:
                    for li_list_element in tab.find_all("li"):
                        if __name__ == "__main__": print(f"Processing li element: {li_list_element}")
                        if li_list_element.find('a') is None:
                            continue
                        report_file_url = unquote(li_list_element.find('a').get('href').strip())
                        folder_name = li_list_element.find('a').find('p', class_="m-0 p-0 font-weight-bold").get_text().strip().replace('/', '-')
                        
                        file_name = os.path.basename(urlparse(report_file_url).path)
                        
                        comp_name_in_link = links_service.get_name_from_link(link)
                        unified_comp_name = find_original_sentence(comp_name_in_link)
                        if unified_comp_name is None or folder_name is None:
                            continue
                        
                        # Sanitize folder and file names
                        safe_comp_name = sanitize_filename(unified_comp_name)
                        safe_folder_name = sanitize_filename(folder_name)
                        safe_file_name = sanitize_filename(file_name)
                        
                        folder_path = os.path.join(os.getcwd(), "competitions", safe_comp_name, "reports", safe_folder_name)
                        os.makedirs(folder_path, exist_ok=True)
                        report_file_path = os.path.join(folder_path, safe_file_name)
                        
                        if update_downloads:
                            download.download_file(report_file_url, report_file_path)
                            files_downloaded += 1

                        if update_database:
                            competition_crud_services.update_or_create_report_file(
                                comp_name=unified_comp_name,
                                year=year,
                                file_path=report_file_path,
                                rank="finalist",
                                stage="final-report",
                            )
                            fields_updated += 1
                else:
                    print("No x-subElement")
        else:
            print("The specified element was not found.")

    # Competition data
    try:
        image_link = get_competition_image_link(soup)
        comp_description = get_competition_description(soup)
        application_link = get_competition_application_link(soup)
        comp_name = get_competition_name(soup)
        timeline = get_competition_timeline(soup)
        awards = get_competition_awards(soup)

        if __name__ == "__main__": print(f"Extracted Competition Data: \
                                         {{'image_link': {image_link}, \
                                         'comp_description': {comp_description}, \
                                         'application_link': {application_link}, \
                                         'comp_name': {comp_name}, \
                                         'timeline': {timeline}, \
                                         'awards': {awards}}}")

        if update_database:
            # create or update competition
            competition_obj = competition_crud_services.update_or_create_competition(
                link=link,
                image_link=image_link,
                application_link=application_link,
                comp_name=comp_name,
                comp_description=comp_description,
                comp_link=link,
                year=year,
            )
            
            # Update competition data with timeline and awards
            if competition_obj and competition_obj.id and (timeline or awards):
                competition_crud_services.update_or_create_competition_data(
                    competition_id=competition_obj.id,
                    year=year,
                    timeline=timeline,
                    awards=awards
                )
            
            updated_competition_data = True        
    except Exception as e:
        print(f"Error extracting competition data: {e}")
    
    status_message = "Success" if response.ok else "Failed"
    return response.status_code, {
        "status": status_message,
        "files_downloaded": files_downloaded,
        "fields_updated": fields_updated,
        "message": f"{status_message}: Downloaded {files_downloaded} file(s), Updated {fields_updated} field(s){', and updated competition data.' if updated_competition_data else '.'}"
    }


def scrape_all_links(lang="tr", check_prev_year_reports: bool = False, update_downloads: bool = False, update_database: bool = False, year=None):
    # set session_id if year is specified
    if year:
        session_id = get_session_id_for_specific_year(year)
    else:
        session_id = None

    all_links = links_service.get_all_links(lang)
    for link in all_links:
        scrape_link(link=link, check_prev_year_reports=check_prev_year_reports, update_downloads=update_downloads, update_database=update_database, year=year, session_id=session_id)



# elements
def get_competition_image_link(soup):
    try:
        image_link = soup.find('div', id='tabsNavigation1').find('p').find('img')['src']
        image_link = unquote(image_link)
        return image_link
    except:
        return None

def get_competition_description(soup):
    try:
        description = soup.find('div', id='tabsNavigation1').text
        return description
    except:
        return None

def get_competition_application_link(soup):
    try:
        application_link = soup.find('div', id='tabsNavigation1').find('a')['href']
        return application_link
    except:
        return None

def get_page_lang(response):
    try:
        content_language = response.headers.get('Content-Language', 'Not Found')
        return content_language
    except:
        return None
    
def get_competition_name(soup):
    try:
        # competition_name = soup.find('div', class_='container').find('h1').text.strip()
        competition_name = soup.find('section', class_='title-competitions').find('h1').text.strip()
        return competition_name
    except:
        return None

def get_competition_timeline(soup):
    """Extract timeline (Yarışma Takvimi) from competition page.
    Returns a list of dictionaries with 'description' and 'date' keys.
    """
    try:
        timeline_data = []
        # Find the table with class 'table table-hover'
        tables = soup.find_all('table', class_='table table-hover')
        
        for table in tables:
            # Check if this table has timeline data by looking for tbody rows
            thead = table.find('thead')
            if not thead:
                continue
            
            # Check if the table headers match timeline structure (Açıklama/Tarih)
            headers = [th.get_text().strip() for th in thead.find_all('th')]
            if 'Açıklama' not in headers and 'Tarih' not in headers:
                # perhaps in English
                if 'Competition' not in headers and 'Calendar' not in headers:
                    continue
            
            tbody = table.find('tbody')
            if not tbody:
                continue
            
            rows = tbody.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    description = cols[0].get_text().strip()
                    date = cols[1].get_text().strip()
                    if description and date:
                        timeline_data.append({
                            'description': description,
                            'date': date
                        })
            
            # If we found timeline data, break (we only need the first matching table)
            if timeline_data:
                break
        
        return timeline_data if timeline_data else None
    except Exception as e:
        print(f"Error extracting timeline: {e}")
        return None

def get_competition_awards(soup):
    """Extract awards (Yarışma Ödülleri) from competition page.
    Returns a dictionary with categories as keys and award lists as values.
    Structure:
    {
        "Category Name": [
            {"rank": "Birinci", "prize": "200.000 ₺"},
            {"rank": "İkinci", "prize": "175.000 ₺"},
            ...
        ],
        ...
    }
    If there's only one category, returns a simple list instead.
    """
    if __name__ == "__main__": print("Extracting competition awards...")
    try:
        awards_data = {}
        
        # Find all h4 elements that contain "Ödül" (awards)
        all_h4s = soup.find_all('h4')
        if __name__ == "__main__": print(f"Found {len(all_h4s)} h4 elements while searching for awards.")
        
        for heading in all_h4s:
            heading_text = heading.get_text().strip()
            if 'Ödül' in heading_text.lower() or \
            'ödüller' in heading_text.lower() or \
            'award' in heading_text.lower() or \
            'awards' in heading_text.lower():
                category_name = heading_text
                if __name__ == "__main__": print(f"Processing awards category: {category_name}")
            
                
                # Find the next table after this heading
                table = heading.find_next('table', class_='table table-hover')
                
                if table:
                    # Verify this is an awards table by checking headers
                    thead = table.find('thead')
                    if thead:
                        headers = [th.get_text().strip() for th in thead.find_all('th')]
                        # Check if it's an awards table (Derece/Ödül columns)
                        if 'Derece' not in headers or 'Ödül' not in headers:
                            # Also check for English headers
                            if 'Rank' not in headers or 'Prize' not in headers:
                                continue
                    
                    tbody = table.find('tbody')
                    if tbody:
                        category_awards = []
                        rows = tbody.find_all('tr')
                        
                        for row in rows:
                            cols = row.find_all('td')
                            if len(cols) >= 2:
                                rank = cols[0].get_text().strip()
                                prize = cols[1].get_text().strip()
                                if rank and prize:
                                    category_awards.append({
                                        'rank': rank,
                                        'prize': prize
                                    })
                        
                        if category_awards:
                            awards_data[category_name] = category_awards
        
        # If only one category, return just the list instead of dict
        if len(awards_data) == 1:
            return list(awards_data.values())[0]
        
        if __name__ == "__main__": print(f"Awards Data Extracted: {awards_data}")
        
        return awards_data if awards_data else None
    except Exception as e:
        print(f"Error extracting awards: {e}")
        return None


# options
def get_session_id_for_specific_year(year):
    try:
        response = requests.get(f"https://teknofest.org/tr/season/{year}")
        session_id = response.cookies.get('sessionid')
        return session_id
    except:
        return None
    



if __name__ == "__main__":
    scrape_link("https://teknofest.org/tr/yarismalar/biyoteknoloji-inovasyon-yarismasi",
                check_prev_year_reports=True, update_downloads=False, update_database=False,
                year="2022")
    
    print("Done !!!")