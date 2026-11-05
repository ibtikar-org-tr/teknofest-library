from bs4 import BeautifulSoup # type: ignore
import requests # type: ignore
from datetime import datetime

def printc(*args):
    decoded_string = ' '.join(args).encode('utf-8').decode('unicode_escape')
    print(decoded_string)

def decode_ia(*args):
    decoded_string = ' '.join(args).encode('utf-8').decode('unicode_escape')
    return decoded_string

headers = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://teknofest.org/tr/content/announcements/'
}

def api_parse_page(url, year, page):
    params = {'q': '','y': year,'page': page}

    response = requests.get(url, headers=headers, params=params)
    html_content = response.text
    html_without_newline = html_content.replace("\\n", "").replace("\\\"", "\"")
    soup = BeautifulSoup(html_without_newline, "html.parser")
    announcements = soup.find_all("div", {"class": "announcement-card"})
    print(f"____ DONE returning {len(announcements)} announcements for year {year} and page {page} at url {url} ____")
    
    announcements_data = []
    for announcement in announcements:
        try:
            title = announcement.find("div", class_="announcement-card-title").text.strip()
            title = decode_ia(title)
            print("title: ", title)

            date = announcement.find("div", {"class": "announcement-card-header"}).find("div", {"class": "announcement-card-date"}).text.strip()
            date = decode_ia(date)
            date = datetime.strptime(date, "%d.%m.%Y").strftime("%Y.%m.%d")
            print("date: ", date)

            link = announcement.find("a")["href"]
            link = "https://teknofest.org" + link
            link = decode_ia(link)
            print("link: ", link)

            print(f"((( Done returning announcement {str(date)}_{str(title)[:10]} )))")
            announcements_data.append([title, date, link])
        except Exception as e:
            print(e)

    return announcements_data

if __name__ == "__main__":
    url = "https://teknofest.org/tr/content/announcements/"
    year = 2023
    page = 1
    x = api_parse_page(url, year, page)
    print("---------------------")
    print(x)
    print("---------------------")