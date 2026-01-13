from app.services.scrape.teams import scrape 
import time

def scrape_all_links(first_page=1, last_page=200, update_downloads: bool = False, update_database=False, year=None):
    # set session_id if year is specified
    if year:
        from app.services.scrape.competitions.scrape import get_session_id_for_specific_year
        session_id = get_session_id_for_specific_year(year)
    else:
        session_id = None
    
    total_stats = {
        "teams_retrieved": 0,
        "reports_downloaded": 0,
        "intros_downloaded": 0,
        "database_updates": 0,
        "errors": 0,
        "pages_processed": 0
    }
    
    count = 0
    for i in range(first_page, last_page):
        print(f"Processing page: {i}")
        page_stats = scrape.scrape_page(page=i, update_downloads=update_downloads, update_database=update_database, year=year, session_id=session_id)
        
        # Aggregate stats
        if page_stats:
            for key in page_stats:
                if key in total_stats:
                    total_stats[key] += page_stats[key]
            total_stats["pages_processed"] += 1
        
        # Wait for 300 seconds (5 minutes) after every 10 pages
        count += 1
        if (count) % 10 == 0:
            print("Waiting for 5 minutes...")
            time.sleep(300)
    
    return total_stats


if __name__ == "__main__":
    link0 = "https://teknofest.org/tr/competitions/competition_report/"

    scrape.scrape_page(link0)