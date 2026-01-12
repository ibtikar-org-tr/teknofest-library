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

    # if all consist of digits and . (single date format like 20.02.2026)
    if (text.replace('.', '').replace(' ', '')).isdigit():
        single_date = convert_date(text)
        # Return as both start and end date with default times
        return single_date, '00:00', single_date, '23:59', None, None

    # Pre-process: Convert time format HH.MM to HH:MM before splitting
    text = re.sub(r'\b(\d{2})\.(\d{2})\b(?!\.\d{4})', r'\1:\2', text)
    
    parts = re.split(r'[ -/\.]', text)
    # Clean empty strings from parts
    parts = [p.strip() for p in parts if p.strip()]

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
        # times (both HH:MM and HH.MM formats)
        if re.match(r'^\d{2}:\d{2}$', part):
            time_2 = part
            if not time_1:
                time_1 = part
            print('time_1: ', time_1)
            print('time_2: ', time_2)
        elif re.match(r'^\d{2}\.\d{2}$', part):
            # Convert HH.MM to HH:MM format
            time_formatted = part.replace('.', ':')
            time_2 = time_formatted
            if not time_1:
                time_1 = time_formatted
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
                if 0 < int(part) < 32 and not re.match(r'^\d{2}:\d{2}$', part):
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
                # Only add small numbers (day/month), not years or times
                num = int(part)
                if 0 < num < 32 and ':' not in part:
                    a_list.append(part)
            except:
                pass
        
        # For formats like "20.02.2026" we have day, month
        # For formats like "20-21.04.2026" we have day1, day2, month
        if len(a_list) >= 2:
            # Check if last number is likely a month (<=12)
            if len(a_list) >= 2 and int(a_list[-1]) <= 12:
                # Last one is the month
                month_1 = month_2 = a_list[-1]
                
                if len(a_list) == 2:
                    # Format: day.month
                    day_1 = day_2 = a_list[0]
                elif len(a_list) == 3:
                    # Format: day1-day2.month
                    day_1 = a_list[0]
                    day_2 = a_list[1]
                elif len(a_list) >= 4:
                    # Format: day1.month1.day2.month2 or similar
                    day_1 = a_list[0]
                    month_1 = a_list[1]
                    day_2 = a_list[2]
                    month_2 = a_list[3] if len(a_list) > 3 and int(a_list[3]) <= 12 else month_1
            else:
                # No clear month indicator, assume first two are day and month
                day_1 = a_list[0] if len(a_list) > 0 else None
                month_1 = a_list[1] if len(a_list) > 1 else None
                day_2 = day_1
                month_2 = month_1


    if not year_1:
        year_1 = year_2 = '2024'
    if not day_1:
        day_1 = day_2 = '01'
    if not month_1:
        month_1 = month_2 = '01'
    if not day_2:
        day_2 = day_1
    if not month_2:
        month_2 = month_1
    if not time_1:
        time_1 = '00:00'
        time_2 = '23:59'
    
    print(f'{year_1}.{month_1}.{day_1} {time_1} - {year_2}.{month_2}.{day_2} {time_2}')

    # Safely format with leading zeros
    try:
        start_date = f'{year_1}.{int(month_1):02d}.{int(day_1):02d}'
    except (ValueError, TypeError):
        start_date = f'{year_1}.01.01'
    
    try:
        end_date = f'{year_2}.{int(month_2):02d}.{int(day_2):02d}'
    except (ValueError, TypeError):
        end_date = f'{year_2}.01.01'

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
    test_cases = [
        # Original test cases
        '2-6 Ekim 2024 - Adana - Şakirpaşa Havalimanı',
        '2024.05.20',
        '30 Haziran- 1 Temmuz 2024',
        '08.06.2024 -17:00 / 22.06.2024-18:00',
        'Haziran-Ağustos 2024',
        # Problem cases from error log
        '20.02.2026',  # Single date
        '25.03.2026 -17:00',  # Single date with time
        '29.06.2026-17:00',  # Single date with time no space
        '20-21.04.2026',  # Day range with month
        '01-04.04.2026',  # Day range with month
        '30 Eylül-4 Ekim 2026',  # Turkish month range
        '06.03.2026 – 17.00',  # With dash and decimal time
        '01.06.2026 – 17.00',  # Another similar case
    ]
    
    print("Testing date conversion:\n")
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. Input: '{test}'")
        try:
            result = convert_full_date(test)
            print(f"   ✓ Output: start={result[0]} {result[1]}, end={result[2]} {result[3]}, city={result[4]}, location={result[5]}")
        except Exception as e:
            print(f"   ✗ ERROR: {e}")
            import traceback
            traceback.print_exc()

