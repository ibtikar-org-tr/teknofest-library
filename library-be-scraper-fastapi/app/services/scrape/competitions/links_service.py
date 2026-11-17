import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from app.services.unify.lists import slug_to_en_slug
from app.services.filename_utils import sanitize_filename


def resolve_disk_comp_slug(link_or_slug: str, html: str | None = None) -> str:
    """
    Resolve the downloads/competitions/<slug> folder name.

    Source of truth: app/services/unify/lists.csv (tr_slug/en_slug/other_slugs).
    Never fuzzy-match — that previously dumped new competitions into wrong folders.
    """
    if not link_or_slug:
        return None

    raw = link_or_slug.strip()
    slug = get_name_from_link(raw) if "://" in raw or raw.startswith("/") else raw.strip("/")

    mapped = slug_to_en_slug.get(slug)
    if mapped:
        return sanitize_filename(mapped)

    # Read EN language switcher from the competition page when available
    page_html = html
    if page_html is None and ("://" in raw or raw.startswith("http")):
        try:
            page_html = requests.get(raw, timeout=30).text
        except Exception:
            page_html = None

    if page_html:
        soup = BeautifulSoup(page_html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/en/competitions/" in href:
                en_slug = get_name_from_link(href)
                if not en_slug:
                    continue
                # Prefer CSV canonical folder if this EN slug (or alias) is known
                mapped = slug_to_en_slug.get(en_slug)
                return sanitize_filename(mapped or en_slug)

    # Last resort: keep the TR/source slug so files stay isolated, not merged wrongly
    return sanitize_filename(slug)


def get_all_links(lang="tr"):
    try:
        link0 = f"https://teknofest.org/{lang}/yarismalar/"
        response0 = requests.get(link0, timeout=10)
        response0.raise_for_status()
        content0 = response0.content
        soup0 = BeautifulSoup(content0, 'html.parser')
        the_list0 = soup0.find('div', class_="tab-content mt-5 mobile-container", id="program")

        if the_list0 is None:
            print(f"Warning: Could not find competitions list for language '{lang}'")
            return []

        items0 = the_list0.find_all('a', class_='btn')

        list_of_links = []
        for i in items0:
            href = i.get('href')
            if href:
                x = "https://teknofest.org" + href
                if x not in list_of_links:
                    list_of_links.append(x)
                    print(x)

        # with open("links.txt", 'w') as f: 
        #     for item in list_of_links:
        #         x = item + "\n"
        #         f.write(x)

        return list_of_links
    except Exception as e:
        print(f"Error fetching links for language '{lang}': {str(e)}")
        return []

def get_name_from_link(link):
    x =  (urlparse(link)).path.strip('/').split('/')[-1]
    return x

def get_all_link_names(lang="tr"):
    links = get_all_links(lang)
    names = []
    for link in links:
        x = get_name_from_link(link)
        names.append(x)
        print(x)
    return names


def get_all_name(lang="tr"):
    try:
        link0 = f"https://teknofest.org/{lang}/yarismalar/"
        response0 = requests.get(link0, timeout=10)
        response0.raise_for_status()
        content0 = response0.content
        soup0 = BeautifulSoup(content0, 'html.parser')
        the_list0 = soup0.find('div', class_="tab-content mt-5 mobile-container", id="program")

        if the_list0 is None:
            print(f"Warning: Could not find competitions list for language '{lang}'")
            return []

        items0 = the_list0.find_all('span', class_='font-weight-bold competition')

        list_of_names = []
        for i in items0:
            x = i.text
            if x not in list_of_names:
                list_of_names.append(x)
                print(x)

        return list_of_names
    except Exception as e:
        print(f"Error fetching competition names for language '{lang}': {str(e)}")
        return []