
function getCityIds(patterns) {
    let cityIds = [];
    Object.keys(patterns).map(pKey => Object.keys(patterns[pKey]).map(cityId => (cityIds.indexOf(cityId) === -1 && cityIds.push(cityId))));
    return cityIds;
}

function getPatternFromMapList(mapList) {
    let frequencyDistribution = {};

    mapList.map(_map =>
        Object.keys(_map).map(cityId => {
            if (!frequencyDistribution.hasOwnProperty(cityId)) {
                frequencyDistribution[cityId] = {};
            }
            Object.keys(_map[cityId]).map(cityPropKey => {
                if (!frequencyDistribution[cityId].hasOwnProperty(cityPropKey)) {
                    frequencyDistribution[cityId][cityPropKey] = {};
                }
                const value = _map[cityId][cityPropKey];
                if (!frequencyDistribution[cityId][cityPropKey].hasOwnProperty(value)) {
                    frequencyDistribution[cityId][cityPropKey][value] = 1 / mapList.length;
                } else {
                    frequencyDistribution[cityId][cityPropKey][value] += 1 / mapList.length;
                }
            });
        })
    );

    return frequencyDistribution;
}


function getElementaryPossibilty(d, atom) {
    let values = Object.keys(atom).map(el => +el);
    if (values.indexOf(d) === -1) {
        values = values.concat([d]);
        values.sort((l, r) => +l - +r);
        const dIndex = values.indexOf(d);

        if (dIndex !== 0 && dIndex !== values.length - 1) {
            const leftIndex = dIndex - 1;
            const rightIndex = dIndex + 1;
            const leftPossibility = atom[values[leftIndex]];
            const rightPossibility = atom[values[rightIndex]];
            const leftValueDistance = values[dIndex] - values[leftIndex];
            const rightValueDistance = values[dIndex] - values[rightIndex];

            const delta = (rightPossibility - leftPossibility) / (leftValueDistance + rightValueDistance) * leftValueDistance;

            return leftPossibility + delta;
        } else {
        }
    } else {
        return atom[d];
    }

    return 0;
}

function getGeneralPossibilty(testMap, pattern, weights, key) {
    const elementaryPossibilities = pattern[key] ? Object.keys(pattern[key]).map(cityKeyId => (testMap[key]
        ? Math.min(getElementaryPossibilty(testMap[key][cityKeyId], pattern[key][cityKeyId]), weights[cityKeyId])
        : 0
    )) : null;

    if (elementaryPossibilities) {
        return Math.max(...elementaryPossibilities);
    } else {
        return 0;
    }
}

function classifyData(testMap, patterns) {

    const weights = {
        x: SETTINGS_VAL["X Weight"],
        y: SETTINGS_VAL["Y Weight"],
        size: SETTINGS_VAL["Size Weight"],
        colorR: SETTINGS_VAL["ColorR Weight"],
        colorG: SETTINGS_VAL["ColorG Weight"],
        colorB: SETTINGS_VAL["ColorB Weight"],
        fontColorR: SETTINGS_VAL["FontColorR Weight"],
        fontColorG: SETTINGS_VAL["FontColorG Weight"],
        fontColorB: SETTINGS_VAL["FontColorB Weight"],
        fontSize: SETTINGS_VAL["FontSize Weight"],
        transparency: SETTINGS_VAL["Transparency Weight"],
        orderIndex: SETTINGS_VAL["DrawingOrder Weight"]
    };

    const cityIds = getCityIds(patterns);

    let possibilities = {};
    cityIds.map(cityId => {
        possibilities[cityId] = {};
        Object.keys(patterns).map(patternKey => {
            return possibilities[cityId][patternKey] = getGeneralPossibilty(testMap, patterns[patternKey], weights, cityId);
        });
    });

    let globalPossibilities = {};

    Object.keys(possibilities).map(cityId => Object.keys(possibilities[cityId]).map(regionId => {
        if (!globalPossibilities[regionId] || globalPossibilities[regionId] < possibilities[cityId][regionId]) {
            globalPossibilities[regionId] = possibilities[cityId][regionId];
        }
    }));

    return globalPossibilities;
}

if (IN_VISUALIZATION && HAS_INPUT["Pattern Maps"] && HAS_INPUT["Test Maps"]) {
    let pMaps = INPUT["Pattern Maps"];
    let patterns = {};
    Object.keys(pMaps).forEach((k) => { patterns[k] = getPatternFromMapList(pMaps[k]); });
    let tMaps = INPUT["Test Maps"];
    let test = [];
    Object.keys(tMaps).forEach((k) => { test = test.concat(tMaps[k]); });
    let header = [ "" ];
    Object.keys(patterns).forEach((k) => { header.push(k); } );
    let result = [ header ];
    test.forEach((t, i) => {
        let series = [ "Map " + (i + 1) ];
        let fc = classifyData(t, patterns);
        for (let i = 1, n = header.length; i < n; ++i)
            series.push(fc[header[i]]);
        result.push(series);
    });
    console.log(result);
    OUTPUT["Weights"] = result;
}
