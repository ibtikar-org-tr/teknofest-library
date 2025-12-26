from bs4 import BeautifulSoup # type: ignore
import requests # type: ignore
import re 

def parsing_announcement_page(url):
    response = requests.get(url)
    html_content = response.text

    soup = BeautifulSoup(html_content, "html.parser")

    text_contents = soup.find_all("div", {"class": "mt-0 p-3 borderCardMob"}) + \
                    soup.find_all("p", {"style": "text-align:justify"})

    links = []

    for text_content in text_contents:
        hrefs = text_content.find_all("a", href=True)
        for href in hrefs:
            links.append(href['href'])
        
        # possible urls
        possible_url_pattern = r'(https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)'
        possible_links = re.findall(possible_url_pattern, text_content.text)
        for possible_link in possible_links:
            if not possible_link in links:
                links.append(possible_link)

    return links

if __name__ == "__main__":
    url = "https://teknofest.org/tr/content/announcement/teknofest-girisim-yarismasi-saglik-ve-iyi-yasam-teknolojileri-kategorisi-sonuclari-aciklandi/"
    x = parsing_announcement_page(url)
    print(x)