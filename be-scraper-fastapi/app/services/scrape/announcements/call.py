from app.services.scrape.announcements.links_service import api_parse_page
from app.services.scrape.announcements.page_service import parsing_announcement_page
from app.services.scrape.announcements.file_service import download_the_files, sanitize_filename
import os 

# list all links
# call a function for every link
# create a fold name {date}_{title}
# download all files to that folder

def main(year=2025, firstpage: int = 1, lastpage: int = 3, lang="tr"):
    url = "https://teknofest.org/tr/content/announcements/"

    for page in range(firstpage, lastpage):
        print(f"Start of page: {page}, {year}")

        announcements_data = api_parse_page(url, year, page)

        for title, date, link in announcements_data:
            announcement_page_url = link

            file_urls  = parsing_announcement_page(announcement_page_url)
            # DOWNLOAD_FOLDER = str(str(year) + '/' + date + "_" + sanitize_filename(title))

            safe_folder_name = sanitize_filename(date + "_" + title)
            safe_folder_name = safe_folder_name.replace(" ", "_")
            safe_folder_name = safe_folder_name.replace(".", "")
            # (also limit length to avoid overshoot for the path)
            safe_folder_name = safe_folder_name[:80]  # arbitrary cut
    
            FILE_PATH = os.path.join(os.getcwd(), "announcement_files", str(year), safe_folder_name)
            download_the_files(file_urls, FILE_PATH)

        print(f"End of page: {page}, {year}")

if __name__ == "__main__":
    main(2024, 1, 3, "tr")