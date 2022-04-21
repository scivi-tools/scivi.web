import os
import re
import json


FOLDER_WITH_MAPS = "data"
SETTLEMENT_PREVALENCE_THRESHOLD = 1  # to print only settlements, drawn from <x> regions


def get_pattern_name_from_filename(file_name):
    return file_name.split(".")[0] \
        .replace("maps from ", "") \
        .replace(" Republic", "") \
        .replace(" Krai", "") \
        .replace(" Oblast", "")


os.chdir(FOLDER_WITH_MAPS)
all_files = os.listdir()
names_of_source_files = [x if re.match(r"^.*\.json$", x) else "" for x in all_files]


name_counter = {}
for file_name in names_of_source_files:
    if file_name != "":
        try:
            pattern_name = get_pattern_name_from_filename(file_name)
            with open(file_name) as jsonfile:
                try:
                    json_data = json.load(jsonfile)
                except Exception as e:
                    print("Invalid map format: " + file_name)
                    continue
                for map_id, map_data in json_data.items():
                    for settlement_name in map_data.keys():
                        if settlement_name not in name_counter:
                            name_counter[settlement_name] = {}
                        name_counter[settlement_name][pattern_name] = name_counter[settlement_name]\
                                                                          .get(pattern_name, 0) + 1
        except Exception as e:
            print(e)
            continue

if SETTLEMENT_PREVALENCE_THRESHOLD < 1:
    print("SETTLEMENT_PREVALENCE_THRESHOLD must be greater than 0")
if SETTLEMENT_PREVALENCE_THRESHOLD == 1:
    print(json.dumps(name_counter, sort_keys=True, ensure_ascii=False, indent=4))
else:
    filtered_name_counter = {}
    for settlement_name, settlement_data in name_counter.items():
        if len(settlement_data.keys()) >= SETTLEMENT_PREVALENCE_THRESHOLD:
            filtered_name_counter[settlement_name] = settlement_data
    print(json.dumps(filtered_name_counter, sort_keys=True, ensure_ascii=False, indent=4))
