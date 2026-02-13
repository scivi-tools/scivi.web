#
# ajas.py
#
# Part of the ARI/ZAH Layered Online Reduction Inspection System (LORIS).
#
# @author Konstantin Riabinin (konstantin.riabinin@uni-heidelberg.de)
#
# This script is a server-side worker providing the report data.
#

from ctypes import c_uint64
from lib.ajas.report import Report
import copy


def get_mission_overview(solutionID: str) -> dict:
    '''
    Get the mission overview.

    @param solutionID - solution ID.
    @return mission overview dictionary.
    '''
    return GLOB[solutionID].mission_overview()

def get_solution_stats(solutionID: str) -> dict:
    '''
    Get the solution statistics.

    @param solutionID - solution ID.
    @return solution statistics dictionary.
    '''
    return GLOB[solutionID].solution_stats()

def get_sanity_checks(solutionID: str) -> dict:
    '''
    Get the sanity checks.

    @param solutionID - solution ID.
    @return sanity checks dictionary.
    '''
    return GLOB[solutionID].sanity_checks()

def get_observations_stats(solutionID: str) -> dict:
    '''
    Get the observations statistics.

    @param solutionID - solution ID.
    @return observations statistics dictionary.
    '''
    return GLOB[solutionID].observations_stats()

def publishFile(config, name):
    '''
    Publish a file so that it is accessible by HTTP.

    @param config - dictionary, in which to store the file path.
    @param name - name of file to publish.
    '''
    PUBLISH_FILE(config[name])
    config[name] = f"/storage{config[name]}"

def get_observations_per_source(solutionID: str) -> dict:
    '''
    Get the observations per source statistics.

    @param solutionID - solution ID.
    @return observations per source statistics dictionary.
    '''
    result = copy.deepcopy(GLOB[solutionID].observations_per_source())
    publishFile(result, "pathNonGaia")
    publishFile(result, "pathGaia")
    return result

def get_src_stats(solutionID: str) -> dict:
    '''
    Get the sources statistics.

    @param solutionID - solution ID.
    @return sources statistics dictionary.
    '''
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
    '''
    Get the residuals statistics.

    @param solutionID - solution ID.
    @return residuals statistics dictionary.
    '''
    result = GLOB[solutionID].res_stats(studentised)
    for subset in result["subsets"]:
        for subsetSlice in subset["slices"]:
            if subsetSlice["chart"] == "heatmap":
                for detector in subsetSlice["detectors"]:
                    publishFile(detector, "eta")
                    publishFile(detector, "zeta")
    return result

def get_observations_of_src(solutionID: str, srcID: str, isJORS: bool) -> dict:
    '''
    Get the observations of a given source.

    @param solutionID - solution ID.
    @param srcID - source ID.
    @param isJORS - flag, indicating if the observations should be expressed in JORS (true) or GRS (false)
    @return statistics dictionary of a set of observations of given source.
    '''
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

def get_lo_calib_stats(solutionID: str) -> dict:
    '''
    Get the lower-order calibration statistics.

    @param solutionID - solution ID.
    @return lower-order calibration statistics dictionary.
    '''
    result = GLOB[solutionID].get_lo_calib_stats()
    publishFile(result, "timestamps")
    for param in result["params"]:
        for detector in param["detectors"]:
            for etaValues in detector["etaValues"]:
                publishFile(etaValues, "data")
            for zetaValues in detector["zetaValues"]:
                publishFile(zetaValues, "data")
            for etaFit in detector["etaFit"]:
                publishFile(etaFit, "data")
            for zetaFit in detector["zetaFit"]:
                publishFile(zetaFit, "data")
            for etaResiduals in detector["etaResiduals"]:
                publishFile(etaResiduals, "data")
            for zetaResiduals in detector["zetaResiduals"]:
                publishFile(zetaResiduals, "data")
    return result

def sdbm(s):
    '''
    Get the SDB hash of a string.

    @param s - string to calculate hash for.
    @return SDBM hash.
    '''
    result = 0
    for c in s:
        result = c_uint64(ord(c) + (result << 6) + (result << 16) - result).value
    return result

def solution_id() -> str:
    '''
    Get the solution ID.

    @return ID of the currently handled solution.
    '''
    return str(sdbm(SETTINGS_VAL["Input Data Path"] + SETTINGS_VAL["Solution Path"]))

if MODE == "INITIALIZATION":
    ipath = SETTINGS_VAL["Input Data Path"]
    spath = SETTINGS_VAL["Solution Path"]
    sID = solution_id()
    GLOB[sID] = Report(sID, ipath, spath, "/tmp")
if MODE == "RUNNING":
    OUTPUT["Solution"] = solution_id()
