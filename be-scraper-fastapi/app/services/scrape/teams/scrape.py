import os
import requests
from urllib.parse import urlparse, unquote, urljoin
from bs4 import BeautifulSoup
from app.services import download
from app.services.unify.function import find_original_sentence
from app.services.repo_additional import team_crud_services

def scrape_page(page, update_downloads: bool = False, update_database: bool = False):
    try:
        link = f"https://teknofest.org/tr/competitions/competition_report/?search=&page={page}"
        response0 = requests.get(link)
        response0.raise_for_status()
        content0 = response0.content
        soup0 = BeautifulSoup(content0, 'html.parser')
        the_table0 = soup0.find('tbody', id="myTable")

        if the_table0:
            for tr in the_table0.find_all('tr'):
                try:
                    comp_name = tr.find('th').find('a').text.strip()
                    comp_name = find_original_sentence(comp_name)
                    team_name = tr.find_all('td')[0].find('a').text.strip()
                    year = tr.find_all('td')[1].text.strip()

                    folder_path = os.path.join(os.getcwd(), comp_name, "teams", year)
                    os.makedirs(folder_path, exist_ok=True)

                    full_report_file_path = None

                    # download report file if exists
                    try:
                        report_link = tr.find_all('td')[2].find('a')['href']
                        base_file_name = unquote(os.path.basename(urlparse(report_link).path))
                        prefixed_file_name = f"{team_name}_{base_file_name}"
                        full_report_file_path = os.path.join(folder_path, prefixed_file_name)
                        if update_downloads:
                            download.download_file(report_link, full_report_file_path)
                    except:
                        print(f"report failed for {team_name}")

                    # download team intro pahe as html file
                    try:
                        team_link_relative = tr.find_all('td')[3].find('a')['href']
                        team_link = urljoin("https://teknofest.org", team_link_relative)
                        full_intro_file_path = os.path.join(folder_path, f"{team_name}_intro.html")
                        if update_downloads:
                            download.download_file(team_link, full_intro_file_path)
                    except:
                        print(f"team file failed for {team_name}")

                    if update_database:
                        team_name, team_members_list, team_info, institution_name = scrape_team_page(team_link)
                        team_crud_services.update_or_create_team(
                            name=team_name,
                            members_list=team_members_list,
                            description=team_info,
                            institution_name=institution_name,
                            comp_name=comp_name,
                            year=year,
                            report_file_path=full_report_file_path,
                            intro_file_path=full_intro_file_path,
                            team_link=team_link,
                            status="finalist"
                            )
                        pass
                    
                except (AttributeError, IndexError, KeyError) as e:
                    print(f"Skipping a row due to missing data: {e}")
                    continue
        else:
            print("The specified element was not found.")
    except requests.exceptions.RequestException as e:
        print(f"Error while fetching the page: {e}")

def scrape_team_page(team_link):
    try:
        team_page = requests.get(team_link)
        team_page.encoding = team_page.apparent_encoding
        team_page.raise_for_status()
        team_page_soup = BeautifulSoup(team_page.text, 'html.parser')

        # team name
        team_name = team_page_soup.find('h1').text.strip()

        # team members list
        team_members_list = []
        members_row = team_page_soup.find('div', class_='report-team')
        for member_element in members_row.find_all('p'):
            member_name = member_element.get_text(strip=True)
            member_name = member_name.encode('utf-8').decode('utf-8') # TODO not encoding properly
            team_members_list.append(member_name)

        # team info
        team_info_div = team_page_soup.find('div', class_='team-info')
        team_info_h6 = team_info_div.find('h6')
        if team_info_h6:
            team_info_h6.extract()
        team_info = team_info_div.text.strip()

        institution_name = team_page_soup.find('p', class_='school').text.strip()

        return team_name, team_members_list, team_info, institution_name
    except requests.exceptions.RequestException as e:
        print(f"Error while fetching the page: {e}")
        return None, None, None
    


