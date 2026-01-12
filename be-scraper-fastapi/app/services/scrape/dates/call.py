from app.services.scrape.dates import csv
from app.services.scrape.dates import json as json_service
from app.services.scrape.dates import add_to_list
from app.services.scrape.competitions import links_service

def process_links(lang="tr"):
    links = links_service.get_all_links(lang)
    for link in links:
        link = link.strip()
        if link:
            data = add_to_list.extract_dates_to_list(link)
            for line in data:
                csv.write_to_csv(line, 'X.cvs')

def process_links_json(lang="tr", file_name='competition_dates.json'):
    """
    Process competition links and write dates data to JSON file.
    
    Args:
        lang: Language code (default: "tr")
        file_name: Name of the JSON file to create
    """
    # Initialize the JSON file (clear it if it exists)
    json_service.initialize_json_file(file_name)
    
    links = links_service.get_all_links(lang)
    for link in links:
        link = link.strip()
        if link:
            data = add_to_list.extract_dates_to_list(link)
            for line in data:
                json_service.write_to_json(line, file_name)

if __name__ == "__main__":
    process_links("tr")
