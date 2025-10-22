
from ctypes import c_uint64
from lib.ajas.report import Report
import copy


def get_mission_overview(solutionID: str) -> dict:
    return GLOB[solutionID].mission_overview()

def get_solution_stats(solutionID: str) -> dict:
    return GLOB[solutionID].solution_stats()

def get_sanity_checks(solutionID: str) -> dict:
    return GLOB[solutionID].sanity_checks()

def get_observations_stats(solutionID: str) -> dict:
    return GLOB[solutionID].observations_stats()

def get_observations_per_source(solutionID: str) -> dict:
    result = copy.deepcopy(GLOB[solutionID].observations_per_source())
    PUBLISH_FILE(result["pathNonGaia"])
    PUBLISH_FILE(result["pathGaia"])
    result["pathNonGaia"] = f"/storage{result["pathNonGaia"]}"
    result["pathGaia"] = f"/storage{result["pathGaia"]}"
    return result

def get_src_stats(solutionID: str) -> dict:
    result = copy.deepcopy(GLOB[solutionID].src_stats())
    PUBLISH_FILE(result["pathUpsilonNonGaiaGRS"])
    PUBLISH_FILE(result["pathUpsilonGaiaGRS"])
    PUBLISH_FILE(result["pathRhoNonGaiaGRS"])
    PUBLISH_FILE(result["pathRhoGaiaGRS"])
    PUBLISH_FILE(result["pathUpsilonNonGaiaJORS"])
    PUBLISH_FILE(result["pathUpsilonGaiaJORS"])
    PUBLISH_FILE(result["pathRhoNonGaiaJORS"])
    PUBLISH_FILE(result["pathRhoGaiaJORS"])
    result["pathUpsilonNonGaiaGRS"] = f"/storage{result["pathUpsilonNonGaiaGRS"]}"
    result["pathUpsilonGaiaGRS"] = f"/storage{result["pathUpsilonGaiaGRS"]}"
    result["pathRhoNonGaiaGRS"] = f"/storage{result["pathRhoNonGaiaGRS"]}"
    result["pathRhoGaiaGRS"] = f"/storage{result["pathRhoGaiaGRS"]}"
    result["pathUpsilonNonGaiaJORS"] = f"/storage{result["pathUpsilonNonGaiaJORS"]}"
    result["pathUpsilonGaiaJORS"] = f"/storage{result["pathUpsilonGaiaJORS"]}"
    result["pathRhoNonGaiaJORS"] = f"/storage{result["pathRhoNonGaiaJORS"]}"
    result["pathRhoGaiaJORS"] = f"/storage{result["pathRhoGaiaJORS"]}"
    return result

def get_res_stats(solutionID: str, studentised: bool) -> dict:
    return GLOB[solutionID].res_stats(studentised)

def get_observations_of_src(solutionID: str, srcID: str, isJORS: bool) -> dict:
    path = f"/tmp/{solutionID}_obs_of_src_{srcID}.dat"
    result = GLOB[solutionID].get_obs_of_src(int(srcID), isJORS, path)
    PUBLISH_FILE(path)
    result["path"] = f"/storage{path}"
    return result

def get_src_uncertainties(solutionID: str) -> dict:
    # obsStats = get_obs_stats(solutionID)
    # path = f"/tmp/{solutionID}_src_uncertainties.dat"
    # srcUns = obsStats.dump_src_uncertainties(path, GLOB[solutionID])
    # PUBLISH_FILE(path)
    # srcUns["path"] = f"/storage{path}"
    # return srcUns
    return None

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
    sID = solution_id()
    GLOB[sID] = Report(sID, ipath, spath, "/tmp")
if MODE == "RUNNING":
    OUTPUT["Solution"] = solution_id()
