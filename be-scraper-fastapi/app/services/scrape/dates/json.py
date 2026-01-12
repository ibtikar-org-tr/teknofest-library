import json
import os
from datetime import datetime

def write_to_json(data_list, file_name='competition_dates.json'):
    """
    Append competition dates data to a JSON file.
    
    Args:
        data_list: List containing [competition_name, event, full_date, start_date, time_1, end_date, time_2, city_str, location_str]
        file_name: Name of the JSON file to write to
    """
    # Load existing data if file exists
    if os.path.exists(file_name):
        with open(file_name, 'r', encoding='utf-8') as file:
            try:
                existing_data = json.load(file)
            except json.JSONDecodeError:
                existing_data = []
    else:
        existing_data = []
    
    # Create structured data object
    competition_date_entry = {
        "competition_name": data_list[0],
        "event": data_list[1],
        "full_date": data_list[2],
        "start_date": data_list[3],
        "start_time": data_list[4],
        "end_date": data_list[5],
        "end_time": data_list[6],
        "city": data_list[7],
        "location": data_list[8]
    }
    
    existing_data.append(competition_date_entry)
    
    # Write back to file
    with open(file_name, 'w', encoding='utf-8') as file:
        json.dump(existing_data, file, ensure_ascii=False, indent=2)


def initialize_json_file(file_name='competition_dates.json'):
    """
    Initialize/clear the JSON file before starting a new scraping session.
    
    Args:
        file_name: Name of the JSON file to initialize
    """
    with open(file_name, 'w', encoding='utf-8') as file:
        json.dump([], file, ensure_ascii=False, indent=2)
