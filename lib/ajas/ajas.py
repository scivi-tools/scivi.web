
import lib.ajas.raccoons as raccoons

def get_mission_overview(solutionID: str) -> dict:
    return GLOB[solutionID].mission_overview()

def get_solution_stats(solutionID: str) -> dict:
    return GLOB[solutionID].solution_stats()

def get_observations_stats(solutionID: str) -> dict:
    if solutionID + "_obsStats" in GLOB:
        obsStats = GLOB[solutionID + "_obsStats"]
    else:
        obsStats = raccoons.ObsStats(GLOB[solutionID])
        GLOB[solutionID + "_obsStats"] = obsStats
    return { \
        "min": obsStats.min(), \
        "max": obsStats.max(), \
        "avg": obsStats.avg(), \
        "hist": list(obsStats.histogram(50))
    }

def solution_id() -> str:
    return str(hash(SETTINGS_VAL["Input Data Path"] + SETTINGS_VAL["Solution Path"]))

if MODE == "INITIALIZATION":
    ipath = SETTINGS_VAL["Input Data Path"]
    spath = SETTINGS_VAL["Solution Path"]
    GLOB[solution_id()] = raccoons.Engine(ipath + "/obs.dat", ipath + "/src.dat", spath)
if MODE == "RUNNING":
    OUTPUT["Solution"] = solution_id()
