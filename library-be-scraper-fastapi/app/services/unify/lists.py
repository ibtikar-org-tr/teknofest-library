import csv
import os

# Get the directory of this file
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(current_dir, 'lists.csv')

# Initialize lists
ar_names_list = []
tr_names_list = []
tr_slugs_list = []
en_names_list = []
en_slugs_list = []
tr_links_list = []
en_links_list = []
min_members_list = []
max_members_list = []
tk_number_list = []
t3kys_number_list = []
type_list = []
other_names_list = []
other_slugs_list = []

# Any known slug (tr_slug, en_slug, or other_slugs entry) -> canonical en_slug (disk folder)
slug_to_en_slug = {}

def _split_aliases(raw: str) -> list[str]:
    if not raw:
        return []
    parts = []
    for chunk in raw.replace(';', '|').split('|'):
        value = chunk.strip()
        if value:
            parts.append(value)
    return parts


def _register_slug(alias: str, en_slug: str) -> None:
    if not alias or not en_slug:
        return
    slug_to_en_slug[alias] = en_slug


# Parse CSV file
try:
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            tr_link = row.get('tr_link', '').strip()
            tr_slug = row.get('tr_slug', '').strip()
            en_link = row.get('en_link', '').strip()
            en_slug = row.get('en_slug', '').strip()
            ar_name = row.get('ar_name', '').strip()
            tr_name = row.get('tr_name', '').strip()
            en_name = row.get('en_name', '').strip()
            other_names = row.get('other_names', '').strip()
            other_slugs = row.get('other_slugs', '').strip()
            min_members = row.get('min_member', '').strip()
            max_members = row.get('max_member', '').strip()
            tk_number = row.get('tk_number', '').strip()
            t3kys_number = row.get('t3kys_number', '').strip()
            competition_type = row.get('type', '').strip().lower()
            if competition_type not in ('competitive', 'innovative'):
                competition_type = ''
            
            # Only add if we have at least TR and EN links
            if tr_link and en_link:
                tr_links_list.append(tr_link)
                tr_slugs_list.append(tr_slug)
                en_links_list.append(en_link)
                en_slugs_list.append(en_slug)
                ar_names_list.append(ar_name)
                tr_names_list.append(tr_name)
                en_names_list.append(en_name)
                other_names_list.append(other_names)
                other_slugs_list.append(other_slugs)
                min_members_list.append(int(min_members) if min_members else None)
                max_members_list.append(int(max_members) if max_members else None)
                tk_number_list.append(int(tk_number) if tk_number else None)
                t3kys_number_list.append(int(t3kys_number) if t3kys_number else None)
                type_list.append(competition_type or None)

                _register_slug(tr_slug, en_slug)
                _register_slug(en_slug, en_slug)
                for alias in _split_aliases(other_slugs):
                    _register_slug(alias, en_slug)
except FileNotFoundError:
    print(f"Warning: CSV file not found at {csv_file_path}")
except Exception as e:
    print(f"Error reading CSV file: {str(e)}")

# Combine the lists into a single list of groups for find_original_sentence
# full_groups format: [en_link, tr_link, ar_name, tr_name, en_name, en_slug, tr_slug, ...other_slugs, ...other_names]
# Keep en_link as group[0] for DB lookups (get_competition_by_en_link).
full_groups = []
for idx in range(len(tr_links_list)):
    group = [
        en_links_list[idx],
        tr_links_list[idx],
        ar_names_list[idx],
        tr_names_list[idx],
        en_names_list[idx],
        en_slugs_list[idx],
        tr_slugs_list[idx],
    ]
    group.extend(_split_aliases(other_slugs_list[idx]))
    group.extend(_split_aliases(other_names_list[idx]))
    full_groups.append(group)

if __name__ == "__main__":
    print(f"Loaded {len(tr_links_list)} competitions from CSV")
    print(f"Slug aliases: {len(slug_to_en_slug)}")
    print(f"TR names: {len(tr_names_list)}")
    print(f"EN names: {len(en_names_list)}")
    print(f"AR names: {len(ar_names_list)}")
    print(f"Full groups: {len(full_groups)}")
