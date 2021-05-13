var shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

var stimulate = function () {
    var words = CACHE["Words"];
    var idx = CACHE["Index"];
    if (idx % 2)
        CACHE["Word"] = words[Math.floor(idx / 2)];
    else
        CACHE["Word"] = null;
    ++idx;
    CACHE["Index"] = idx;
    if (idx <= words.length * 2) {
        setTimeout(stimulate, SETTINGS_VAL["Timeout"]);
    } else {
        var iter = CACHE["Iteration"];
        ++iter;
        if (iter <= SETTINGS_VAL["Iterations Count"]) {
            CACHE["Iteration"] = iter;
            CACHE["Index"] = 0;
            setTimeout(stimulate, SETTINGS_VAL["Timeout"]);
        } else {
            CACHE["Iteration"] = 0;
        }
    }
    PROCESS();
}

if (IN_VISUALIZATION) {
    var sh = CACHE["Words"];
    if (!sh) {
        sh = SETTINGS_VAL["Words"].split("\n");
        shuffle(sh);
        CACHE["Words"] = sh;
        CACHE["Index"] = 0;
        CACHE["Iteration"] = 1;
        setTimeout(stimulate, SETTINGS_VAL["Timeout"]);
    }
    OUTPUT["Word"] = CACHE["Word"];
    OUTPUT["Iteration"] = CACHE["Iteration"];
} else {
    CACHE["Words"] = null;
    CACHE["Index"] = -1;
    CACHE["Iteration"] = 0;
    CACHE["Word"] = null;
}
