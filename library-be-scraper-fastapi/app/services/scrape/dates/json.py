import json
import os
from datetime import datetime

def write_competitions_to_json(competitions_data, file_name='competition_dates.json'):
    """
    Write competition data with events grouped as children to a JSON file.
    
    Args:
        competitions_data: Dict with structure {competition_name: [events]}
                          where each event is [event, full_date, start_date, time_1, end_date, time_2, city_str, location_str]
        file_name: Name of the JSON file to write to
    """
    # Convert dict to list of competition objects
    result = []
    for competition_name, events_list in competitions_data.items():
        events = []
        for event_data in events_list:
            event_obj = {
                "event": event_data[0],
                "full_date": event_data[1],
                "start_date": event_data[2],
                "start_time": event_data[3],
                "end_date": event_data[4],
                "end_time": event_data[5],
                "city": event_data[6],
                "location": event_data[7]
            }
            events.append(event_obj)
        
        competition_entry = {
            "competition_name": competition_name,
            "events": events
        }
        result.append(competition_entry)
    
    # Write to file
    with open(file_name, 'w', encoding='utf-8') as file:
        json.dump(result, file, ensure_ascii=False, indent=2)


def initialize_json_file(file_name='competition_dates.json'):
    """
    Initialize/clear the JSON file before starting a new scraping session.
    
    Args:
        file_name: Name of the JSON file to initialize
    """
    with open(file_name, 'w', encoding='utf-8') as file:
        json.dump([], file, ensure_ascii=False, indent=2)
