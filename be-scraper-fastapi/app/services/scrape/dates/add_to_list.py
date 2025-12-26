import requests
from bs4 import BeautifulSoup
from app.services.scrape.dates.convert_dates import convert_full_date
from app.services.unify.function import find_original_sentence

def extract_dates_to_list(url):
    print(f"Processing: {url}")
    url_response = requests.get(url)
    url_content = url_response.content

    soup = BeautifulSoup(url_content, 'html.parser')
    target_contents = soup.select('div.tab-pane.tab-pane-navigation')

    competition_name = soup.find('h1', class_='text-white').text.strip()
    competition_name = find_original_sentence(competition_name)
    list0 = []

    target_content = None
    for x in target_contents:
        try:
            if 'Yarışma Takvimi' in x.find('h4').text.strip():
                target_content = x
            else:
                continue
        except:
            pass

    if target_content is not None:
        for tr in target_content.find_all('tr', class_='d-flex reset-bottom1'):
            try:
                # print(tr)
                event = tr.find('td', class_='col-5').text.strip()
                full_date = tr.find('td', class_='col-7').text.strip()
                start_date, time_1, end_date, time_2, city_str, location_str = convert_full_date(full_date)
                if location_str == '-':
                    location_str = None
                list0.append([competition_name, event, full_date, start_date, time_1, end_date, time_2, city_str, location_str])
            except Exception as e:
                print(f"Error processing row: {e}")

    return list0


url = "https://teknofest.org/tr/yarismalar/biyoteknoloji-inovasyon-yarismasi/"

if __name__ == '__main__':
    for x in extract_dates_to_list(url):
        print(x)
