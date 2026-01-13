from app.services.scrape.teams import scrape 
import time

def scrape_all_links(first_page=1, last_page=200, update_downloads: bool = False, update_database=False, year=None):
    # set session_id if year is specified
    if year:
        from app.services.scrape.competitions.scrape import get_session_id_for_specific_year
        session_id = get_session_id_for_specific_year(year)
    else:
        session_id = None
    
    count = 0
    for i in range(first_page, last_page):
        print(f"Processing page: {i}")
        scrape.scrape_page(page=i, update_downloads=update_downloads, update_database=update_database, year=year, session_id=session_id)
        
        # Wait for 300 seconds (5 minutes) after every 10 pages
        count += 1
        if (count) % 10 == 0:
            print("Waiting for 5 minutes...")
            time.sleep(300)


if __name__ == "__main__":
    link0 = "https://teknofest.org/tr/competitions/competition_report/"

    scrape.scrape_page(link0)