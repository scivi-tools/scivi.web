
var headers = {
    "Observations": [
        { "name": "obsID", "type": "int" },
        { "name": "srcID", "type": "int" },
        { "name": "exposureID", "type": "int" },
        { "name": "detectorID", "type": "int" },
        { "name": "kappaObs", "type": "double" },
        { "name": "muObs", "type": "double" },
        { "name": "weightEta", "type": "double" },
        { "name": "weightZeta", "type": "double" }
    ],
    "Source Updates": [
        { "name": "srcID", "type": "int" },
        { "name": "upsilon", "type": "double" },
        { "name": "rho", "type": "double" },
        { "name": "updatedUpsilon", "type": "double" },
        { "name": "updatedRho", "type": "double" },
        { "name": "updateUpsilon", "type": "double" },
        { "name": "updateRho", "type": "double" },
        { "name": "sigmaUpsilon", "type": "double" },
        { "name": "sigmaRho", "type": "double" },
    ],
    "Calibration Updates": [
        { "name": "order", "type": "int" },
        { "name": "detector", "type": "int" },
        { "name": "unit", "type": "int" },
        { "name": "r", "type": "int" },
        { "name": "s", "type": "int" },
        { "name": "coordinate", "type": "string" },
        { "name": "value", "type": "double" }
    ],
    "Residuals": [
        { "name": "obsID", "type": "int" },
        { "name": "rEta", "type": "double" },
        { "name": "rZeta", "type": "double" },
        { "name": "sigmaEta", "type": "double" },
        { "name": "sigmaZeta", "type": "double" },
        { "name": "epsilonEta", "type": "double" },
        { "name": "epsilonZeta", "type": "double" }
    ],
    "Spectrum": [
        { "name": "value", "type": "double" }
    ]
};

var table = SETTINGS["Table"][SETTINGS_VAL["Table"]];
OUTPUT["Data"] = [ { "table": table, "header": headers[table] } ];
