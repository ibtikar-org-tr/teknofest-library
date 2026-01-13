import csv
import os

# Get the directory of this file
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(current_dir, 'lists.csv')

# Initialize lists
ar_names_list = []
tr_names_list = []
en_names_list = []
tr_links_list = []
en_links_list = []
min_members_list = []
max_members_list = []

# Parse CSV file
try:
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            tr_link = row.get('tr_link', '').strip()
            en_link = row.get('en_link', '').strip()
            ar_name = row.get('ar_name', '').strip()
            tr_name = row.get('tr_name', '').strip()
            en_name = row.get('en_name', '').strip()
            min_members = row.get('min#', '').strip()
            max_members = row.get('max#', '').strip()
            
            # Only add if we have at least TR and EN links
            if tr_link and en_link:
                tr_links_list.append(tr_link)
                en_links_list.append(en_link)
                ar_names_list.append(ar_name)
                tr_names_list.append(tr_name)
                en_names_list.append(en_name)
                min_members_list.append(int(min_members) if min_members else None)
                max_members_list.append(int(max_members) if max_members else None)
except FileNotFoundError:
    print(f"Warning: CSV file not found at {csv_file_path}")
except Exception as e:
    print(f"Error reading CSV file: {str(e)}")

# Combine the lists into a single list of groups for find_original_sentence
# full_groups format: [en_link, tr_link, ar_name, tr_name, en_name]
full_groups = [
    [en_link, tr_link, ar_name, tr_name, en_name]
    for tr_link, en_link, ar_name, tr_name, en_name 
    in zip(tr_links_list, en_links_list, ar_names_list, tr_names_list, en_names_list)
]

if __name__ == "__main__":
    print(f"Loaded {len(tr_links_list)} competitions from CSV")
    print(f"TR names: {len(tr_names_list)}")
    print(f"EN names: {len(en_names_list)}")
    print(f"AR names: {len(ar_names_list)}")
    print(f"Full groups: {len(full_groups)}")
