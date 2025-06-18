
import lib.ajas.raccoons as raccoons
from ctypes import c_uint64

def get_mission_overview(solutionID: str) -> dict:
    return GLOB[solutionID].mission_overview()

def get_solution_stats(solutionID: str) -> dict:
    return GLOB[solutionID].solution_stats()

def get_obs_stats(solutionID):
    k = solutionID + "_obsStats"
    if not k in GLOB:
        GLOB[k] = raccoons.ObsStats(GLOB[solutionID])
    return GLOB[k]

def get_observations_stats(solutionID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    return { \
        "min": obsStats.min(), \
        "max": obsStats.max(), \
        "avg": obsStats.avg(), \
        "hist": list(obsStats.histogram(50))
    }

def get_observations_per_source(solutionID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    path = f"/tmp/{solutionID}_obs_per_src.dat"
    obsPerSrc = obsStats.dump_obs_per_src(path, GLOB[solutionID])
    PUBLISH_FILE(path)
    obsPerSrc["path"] = f"/storage{path}"
    return obsPerSrc

def sdbm(s):
    result = 0
    for c in s:
        result = c_uint64(ord(c) + (result << 6) + (result << 16) - result).value
    return result

def solution_id() -> str:
    return str(sdbm(SETTINGS_VAL["Input Data Path"] + SETTINGS_VAL["Solution Path"]))

if MODE == "INITIALIZATION":
    ipath = SETTINGS_VAL["Input Data Path"]
    spath = SETTINGS_VAL["Solution Path"]
    GLOB[solution_id()] = raccoons.Engine(ipath + "/obs.dat", ipath + "/src.dat", spath)
if MODE == "RUNNING":
    OUTPUT["Solution"] = solution_id()
