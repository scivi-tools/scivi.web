import json
import os

FOLDER_WITH_MAPS = "data"
PATTERNS_FILES = {
    "Altai": "maps from Altai Republic.json",
    "Bashkortostan": "maps from Bashkortostan Republic.json",
    "Crimea": "maps from Crimea Republic.json",
    "Orenburg": "maps from Orenburg Oblast.json",
    "Perm": "maps from Perm Krai.json",
    "Primorsky": "maps from Primorsky Krai.json",
    "Tomsk": "maps from Tomsk Oblast.json"
}
TEST_MAPS_FILES = ["maps from unknown place.json"]  # files with maps to classify

# These are parameters that can be adjusted
POPULAR_SETTLEMENTS = [  # This is the set K
    "Vladivostok",
    "Yekaterinburg",
    "Kazan",
    "Krasnodar",
    "Krasnoyarsk",
    "Moscow",
    "Novosibirsk",
    "St. Petersburg",
    "Sochi"
]
POPULARITY_REDUCTION_FACTOR = 0.5
WEIGHTS = {  # in [0, 1]
    "x": 1,
    "y": 1,
    "volume": 1,
    "colorR": 1,
    "colorG": 1,
    "colorB": 1,
    "fontColorR": 1,
    "fontColorG": 1,
    "fontColorB": 1,
    "fontSize": 1,
    "transparency": 1,
    "orderIndex": 1
}


def get_pattern_from_map_list(map_list):
    frequency_distribution = {}
    for map_id, map_data in map_list.items():
        for settlement_id in map_data.keys():
            if settlement_id not in frequency_distribution:
                frequency_distribution[settlement_id] = {}
            for settlement_parameter in map_data[settlement_id].keys():
                if settlement_parameter not in frequency_distribution[settlement_id]:
                    frequency_distribution[settlement_id][settlement_parameter] = {}
                value = map_data[settlement_id][settlement_parameter]
                if value not in frequency_distribution[settlement_id][settlement_parameter]:
                    frequency_distribution[settlement_id][settlement_parameter][value] = 1
                else:
                    frequency_distribution[settlement_id][settlement_parameter][value] += 1

    for settlement_id, settlement_parameters in frequency_distribution.items():
        for settlement_param_id, settlement_param_values in settlement_parameters.items():
            max_val = max([settlement_param_values[val_key] for val_key in settlement_param_values.keys()])
            for settlement_param_val_key, settlement_param_val_freq in settlement_param_values.items():
                frequency_distribution[settlement_id][settlement_param_id][settlement_param_val_key] = round(
                    settlement_param_val_freq / max_val,
                    2
                )

    return frequency_distribution


def get_settlement_ids_from_patterns(patterns):
    settlement_ids = []
    for pattern_key in patterns.keys():
        for city_id in patterns[pattern_key].keys():
            if city_id not in settlement_ids:
                settlement_ids.append(city_id)
    return settlement_ids


def get_elementary_possibility(datum, atom):
    if datum not in atom.keys():
        all_values = sorted(list(atom.keys()) + [datum], key=lambda item: float(item))
        datum_index = all_values.index(datum)

        if datum_index != 0 and datum_index != len(all_values) - 1:
            left_neighbour_index = datum_index - 1
            right_neighbour_index = datum_index + 1
            left_neighbour_possibility = atom[all_values[left_neighbour_index]]
            right_neighbour_possibility = atom[all_values[right_neighbour_index]]
            distance_to_left_neighbour = float(datum) - float(all_values[left_neighbour_index])
            distance_between_neighbours = float(all_values[right_neighbour_index])\
                                          - float(all_values[left_neighbour_index])
            # print(distance_to_left_neighbour, distance_to_right_neighbour)
            datum_possibility = distance_to_left_neighbour / distance_between_neighbours *\
                (right_neighbour_possibility - left_neighbour_possibility) + left_neighbour_possibility
            return datum_possibility
    else:
        return atom[datum]
    return 0


def get_general_possibility(test_map, pattern, settlement_id):
    elementary_possibilities = None
    if settlement_id in pattern:
        elementary_possibilities = []
        for parameter_id in pattern[settlement_id].keys():
            if settlement_id in test_map:
                elementary_possibility = get_elementary_possibility(
                    test_map[settlement_id][parameter_id],
                    pattern[settlement_id][parameter_id]
                )
                elementary_possibilities.append(max(elementary_possibility, 1 - WEIGHTS[parameter_id]))
            else:
                elementary_possibilities.append(0)
    if elementary_possibilities:
        return round(min(elementary_possibilities), 2)
    else:
        return 0


def classify_data(test_map, patterns):
    settlement_ids = get_settlement_ids_from_patterns(patterns)
    possibilities = {}
    for settlement_id in settlement_ids:
        for region_id in patterns.keys():
            general_possibility = get_general_possibility(test_map, patterns[region_id], settlement_id)
            if general_possibility:
                if settlement_id not in possibilities:
                    possibilities[settlement_id] = {}
                possibilities[settlement_id][region_id] = general_possibility

    global_possibilities = {}
    for settlement_id in possibilities.keys():
        settlement_possibility_sum = sum(
            [possibilities[settlement_id][region_id] for region_id in possibilities[settlement_id].keys()]
        )
        for region_id in possibilities[settlement_id].keys():
            possibility_relation = possibilities[settlement_id][region_id] / settlement_possibility_sum
            popularity_reduction_factor = (
                POPULARITY_REDUCTION_FACTOR
                if settlement_id in POPULAR_SETTLEMENTS and settlement_id != region_id
                else 1
            )
            if region_id not in global_possibilities:
                global_possibilities[region_id] = possibility_relation * popularity_reduction_factor
            else:
                global_possibilities[region_id] += possibility_relation * popularity_reduction_factor
            if possibility_relation == 1:
                global_possibilities[region_id] += possibilities[settlement_id][region_id] * popularity_reduction_factor
    max_possibility = max(list(map(lambda x: global_possibilities[x], global_possibilities.keys())) + [0])
    global_possibilities = [region for region in global_possibilities.keys()
                            if global_possibilities[region] == max_possibility and max_possibility != 0
    ]

    global_possibilities.sort()
    return (max_possibility, global_possibilities)


patterns_of_maps = {}
for pattern_name, pattern_file_name in PATTERNS_FILES.items():
    with open(os.path.join(FOLDER_WITH_MAPS, pattern_file_name)) as f:
        patterns_of_maps[pattern_name] = get_pattern_from_map_list(json.load(f))

for data_source in ["maps from unknown place.json"]:  # files with maps to classify
    with open(os.path.join(FOLDER_WITH_MAPS, data_source)) as f:
        test_maps = json.load(f)

    non_empty_map_number = 0
    regions = {}
    for test_map_id, test_map_data in test_maps.items():
        if not test_map_data:
            continue
        else:
            non_empty_map_number += 1

        _, map_regions = classify_data(test_map_data, patterns_of_maps)
        joined_regions = ", ".join(map_regions)
        regions[joined_regions] = regions.setdefault(joined_regions, 0) + 1
    print(f"{data_source}, count of non-empty maps: {non_empty_map_number}, distribution by regions: {regions}")
