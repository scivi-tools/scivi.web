
var hasInput = HAS_INPUT["Gaze Data"] && INPUT["Gaze Data"];
if (CACHE["namedGazeData"] === undefined || SETTINGS_CHANGED["Track Name"] || (hasInput && INPUT["Gaze Data"] != CACHE["gaze"])) {
    if (hasInput) {
        var gaze = INPUT["Gaze Data"];
        CACHE["gaze"] = gaze;
        var namedTracks = [];
        for (var i = 0, n = gaze.length; i < n; ++i) {
            if (gaze[i].length === gaze[0].length && (namedTracks.length == 0 || namedTracks[namedTracks.length - 1].name !== gaze[i][gaze[i].length - 1]))
                namedTracks.push({ name: gaze[i][gaze[i].length - 1], start: i });
        }
        SETTINGS["Track Name"] = namedTracks.map(function (nt) { return nt.name; });
        if (SETTINGS_VAL["Track Name"] === undefined || SETTINGS_VAL["Track Name"] >= namedTracks.length)
            SETTINGS_VAL["Track Name"] = 0;

        var idx = parseInt(SETTINGS_VAL["Track Name"]);
        CACHE["namedGazeData"] = gaze.slice(namedTracks[idx].start, idx === namedTracks.length - 1 ? gaze.length : namedTracks[idx + 1].start);
        SETTINGS_CHANGED["Track Name"] = false;
    }
}

OUTPUT["Named Gaze Data"] = CACHE["namedGazeData"];
