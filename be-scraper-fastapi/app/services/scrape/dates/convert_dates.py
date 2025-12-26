import re
from datetime import datetime

turkish_months = {
    'ocak': '01', 'şubat': '02', 'mart': '03', 'nisan': '04',
    'mayıs': '05', 'haziran': '06', 'temmuz': '07', 'ağustos': '08',
    'eylül': '09', 'ekim': '10', 'kasım': '11', 'aralık': '12'
}

turkish_cities = [
    'adana', 'adıyaman', 'afyonkarahisar', 'ağrı', 'amasya',
    'ankara', 'antalya', 'artvin', 'aydın', 'balıkesir',
    'bartın', 'batman', 'bayburt', 'bilecik', 'bingöl',
    'bitlis', 'bolu', 'burdur', 'bursa', 'çanakkale',
    'çankırı', 'çorum', 'denizli', 'diyarbakır', 'düzce',
    'edremit', 'elazığ', 'erzincan', 'erzurum', 'eskişehir',
    'gaziantep', 'giresun', 'gümüşhane', 'hakkari', 'hatay',
    'ığdır', 'iğdır', 'istanbul', 'izmir', 'kahramanmaraş',
    'karabük', 'karaman', 'kars', 'kastamonu', 'kayseri',
    'kırıkkale', 'kırklareli', 'kırşehir', 'kocaeli', 'konya',
    'kütahya', 'malatya', 'manisa', 'mardin', 'mersin',
    'muğla', 'muş', 'ordu', 'osmaniye', 'rize',
    'sakarya', 'samsun', 'siirt', 'sivas', 'şanlıurfa',
    'şırnak', 'tekirdağ', 'tokat', 'trabzon', 'tunceli',
    'uşak', 'van', 'yozgat', 'zonguldak'
]



def convert_full_date(text):
    city_str, location_str = None, None
    year_1, year_2, month_1, month_2, day_1, day_2, time_1, time_2 = None, None, None, None, None, None, None, None
    start_date, end_date = None, None

    # if all consist of digits and .
    if (text.replace('.', '')).isdigit():
        return convert_date(text)

    parts = re.split(r'[ -/\.]', text)

    # loop to look for letters
    for part in parts:
        # look for any letter
        if any(x.isalpha() for x in part):
            # turkish months
            if part.lower() in turkish_months:
                print('Turkish Month: ', part.lower())
                month_2 = turkish_months[part.lower()]
                if not month_1:
                    month_1 = turkish_months[part.lower()]
                print('month_1: ', month_1)
                print('month_2: ', month_2)
            # city
            elif part.lower() in turkish_cities:
                city_str = part
                print('City: ', city_str)
            # other letters are for the location
            else:
                location_str = (location_str or '') + (' ' if location_str else '') + part
                print('Location: ', location_str)

    # loop again for times and years
    for part in parts:
        # times
        if re.match(r'^\d{2}:\d{2}$', part):
            time_2 = part
            if not time_1:
                time_1 = part
            print('time_1: ', time_1)
            print('time_2: ', time_2)
        # years
        try:
            if 2017 < int(part) < 2030:
                year_2 = part
                if not year_1:
                    year_1 = part
                print('year_1: ', year_1)
                print('year_2: ', year_2)
        except:
            pass

        # days if month is turkish
        if month_1:
            try:
                if 0 < int(part) < 32:
                    day_2 = part
                    if not day_1:
                        day_1 = part
                    print('day_1: ', day_1)
                    print('day_2: ', day_2)
            except:
                pass


    # loop again if not month is turkish => for days and month
    if not month_1:
        a_list = []
        for part in parts:
            try:
                if 0 < int(part) < 32:
                    a_list.append(part)
            except:
                pass
        variables = [day_1, month_1, day_2, month_2]
        for i in range(len(variables)):
            if not variables[i] and i < len(a_list):
                variables[i] = a_list[i]
                print(variables[i])
        day_1, month_1, day_2, month_2 = variables


    if not year_1:
        year_1 = year_2 = '2024'
    if not day_1:
        day_1 = day_2 = '01'
    if not time_1:
        time_1 = '00:00'
        time_2 = '23:59'
    print(f'{year_1}.{month_1}.{day_1} {time_1} - {year_2}.{month_2}.{day_2} {time_2}')

    start_date = f'{year_1}.{'{:02}'.format(int(month_1))}.{'{:02}'.format(int(day_1))}'
    end_date = f'{year_2}.{'{:02}'.format(int(month_2))}.{'{:02}'.format(int(day_2))}'

    return start_date, time_1, end_date, time_2, city_str, location_str



def convert_date(date_str):
    # Check if the date is already in YYYY.MM.DD format
    if date_str.count('.') == 2 and date_str[4] == '.':
        try:
            # Attempt to parse YYYY.MM.DD format
            date_obj = datetime.strptime(date_str, '%Y.%m.%d')
            return date_str  # Return as is if it's already in the desired format
        except ValueError:
            pass  # If parsing fails, continue to the next condition

    # Check for DD.MM.YYYY format
    if '.' in date_str:
        try:
            date_obj = datetime.strptime(date_str, '%d.%m.%Y')
            return date_obj.strftime('%Y.%m.%d')
        except ValueError:
            pass  # If parsing fails, continue to the next condition

    # Check for YYYY-MM-DD format
    if '-' in date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return date_obj.strftime('%Y.%m.%d')
        except ValueError:
            pass  # If parsing fails, continue to the next condition

    # Check for MM/DD/YYYY format
    if '/' in date_str:
        try:
            date_obj = datetime.strptime(date_str, '%m/%d/%Y')
            return date_obj.strftime('%Y.%m.%d')
        except ValueError:
            pass  # If parsing fails, continue to the next condition

    # If no valid format is matched
    return "Invalid date format"


if __name__ == '__main__':
    text0 = '2-6 Ekim 2024 - Adana - Şakirpaşa Havalimanı'
    text1 = '2024.05.20'
    text2 = '30 Haziran- 1 Temmuz 2024'
    text3 = '08.06.2024 -17:00 / 22.06.2024-18:00'
    text4 = 'Haziran-Ağustos 2024'
    text5 = 'Haziran-2023-Ağustos 2024'
    text6 = '11-15 Eylül 2024 / Tübitak SAGE Yerleşkesi, Ankara'
    text7 = '8 Haziran - 4 temmuz'
    convert_full_date(text3)

