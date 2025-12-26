import csv

def write_to_csv(data_list, file_name):
    with open(file_name, mode='a', newline='', encoding='utf-8-sig') as file:
        writer = csv.writer(file)
        writer.writerow(data_list)