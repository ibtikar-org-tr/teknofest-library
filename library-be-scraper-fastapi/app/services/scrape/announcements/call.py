from app.services.scrape.announcements.links_service import api_parse_page
from app.services.scrape.announcements.page_service import parsing_announcement_page
from app.services.scrape.announcements.file_service import download_the_files
import os 

# list all links
# call a function for every link
# create a fold name {date}_{title}
# download all files to that folder

def _announcement_folder_name(date: str, title: str) -> str:
    """Match existing announcement folder style: keep Turkish, spaces→_, strip path-illegal chars."""
    name = f"{date}_{title}".replace(" ", "_").replace(".", "")
    for ch in '<>:"/\\|?*':
        name = name.replace(ch, "")
    return name[:80]


def main(year=2025, firstpage: int = 1, lastpage: int = 3, lang="tr"):
    url = "https://teknofest.org/tr/content/announcements/"

    for page in range(firstpage, lastpage):
        print(f"Start of page: {page}, {year}")

        announcements_data = api_parse_page(url, year, page)

        for title, date, link in announcements_data:
            announcement_page_url = link

            file_urls  = parsing_announcement_page(announcement_page_url)

            safe_folder_name = _announcement_folder_name(date, title)
    
            FILE_PATH = os.path.join(os.getcwd(), "announcement_files", str(year), safe_folder_name)
            download_the_files(file_urls, FILE_PATH)

        print(f"End of page: {page}, {year}")

if __name__ == "__main__":
    main(2024, 1, 3, "tr")