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
    Process competition links and write dates data to JSON file with events grouped by competition.
    
    Args:
        lang: Language code (default: "tr")
        file_name: Name of the JSON file to create
    """
    # Collect all events grouped by competition
    competitions_dict = {}
    
    links = links_service.get_all_links(lang)
    for link in links:
        link = link.strip()
        if link:
            data = add_to_list.extract_dates_to_list(link)
            # data format: [competition_name, event, full_date, start_date, time_1, end_date, time_2, city_str, location_str]
            for line in data:
                competition_name = line[0]
                event_data = [line[1], line[2], line[3], line[4], line[5], line[6], line[7], line[8]]
                
                if competition_name not in competitions_dict:
                    competitions_dict[competition_name] = []
                competitions_dict[competition_name].append(event_data)
    
    # Write all competitions with their events to JSON
    json_service.write_competitions_to_json(competitions_dict, file_name)

if __name__ == "__main__":
    process_links("tr")
