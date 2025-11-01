
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

def publishFile(config, name):
    PUBLISH_FILE(config[name])
    config[name] = f"/storage{config[name]}"

def get_observations_per_source(solutionID: str) -> dict:
    result = copy.deepcopy(GLOB[solutionID].observations_per_source())
    publishFile(result, "pathNonGaia")
    publishFile(result, "pathGaia")
    return result

def get_src_stats(solutionID: str) -> dict:
    result = copy.deepcopy(GLOB[solutionID].src_stats())
    publishFile(result, "pathUpsilonNonGaiaGRS")
    publishFile(result, "pathUpsilonGaiaGRS")
    publishFile(result, "pathRhoNonGaiaGRS")
    publishFile(result, "pathRhoGaiaGRS")
    publishFile(result, "pathUpsilonNonGaiaJORS")
    publishFile(result, "pathUpsilonGaiaJORS")
    publishFile(result, "pathRhoNonGaiaJORS")
    publishFile(result, "pathRhoGaiaJORS")
    return result

def get_res_stats(solutionID: str, studentised: bool) -> dict:
    result = GLOB[solutionID].res_stats(studentised)
    for subset in result["subsets"]:
        for subsetSlice in subset["slices"]:
            if subsetSlice["chart"] == "heatmap":
                for detector in subsetSlice["detectors"]:
                    publishFile(detector, "eta")
                    publishFile(detector, "zeta")
    return result

def get_observations_of_src(solutionID: str, srcID: str, isJORS: bool) -> dict:
    path = f"/tmp/{solutionID}_obs_of_src_{srcID}.dat"
    result = GLOB[solutionID].get_obs_of_src(int(srcID), isJORS, path)
    result["path"] = path
    publishFile(result, "path")
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
