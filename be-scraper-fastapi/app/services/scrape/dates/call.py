from app.services.scrape.dates import csv
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

if __name__ == "__main__":
    process_links("tr")
