
import lib.ajas.raccoons as raccoons
import numpy as np
import os
from ctypes import c_uint64
from scipy.optimize import curve_fit


def gauss(x, a, x0, sigma):
    return a * np.exp(-(x - x0) ** 2 / (2 * sigma ** 2))

def gaussS1(x, a):
    return a * np.exp(-x ** 2 / 2)

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
        "min": obsStats.min_per_src(), \
        "max": obsStats.max_per_src(), \
        "avg": obsStats.avg_per_src(), \
        "hist": list(obsStats.histogram_per_src(50)) \
    }

def get_sanity_checks(solutionID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    return { \
        "calibUnits": int(obsStats.min_per_calib_unit() > 0), \
        "sources": int(obsStats.min_per_src() > 0), \
        "spectrum": int(np.round(np.sum(np.fromfile(os.path.join(GLOB[solutionID].solution_path(), "spectrum.dat"), \
                                                    dtype = np.double))) == \
                        GLOB[solutionID].mission_overview()["m"]) \
    }

def get_observations_per_source(solutionID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    path = f"/tmp/{solutionID}_obs_per_src.dat"
    obsPerSrc = obsStats.dump_obs_per_src(path, GLOB[solutionID])
    PUBLISH_FILE(path)
    obsPerSrc["path"] = f"/storage{path}"
    return obsPerSrc

def get_observations_of_src(solutionID: str, srcID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    path = f"/tmp/{solutionID}_obs_of_src_{srcID}.dat"
    result = obsStats.dump_obs_of_src(int(srcID), path, GLOB[solutionID])
    PUBLISH_FILE(path)
    result["path"] = f"/storage{path}"
    return result

def get_src_uncertainties(solutionID: str) -> dict:
    obsStats = get_obs_stats(solutionID)
    path = f"/tmp/{solutionID}_src_uncertainties.dat"
    srcUns = obsStats.dump_src_uncertainties(path, GLOB[solutionID])
    PUBLISH_FILE(path)
    srcUns["path"] = f"/storage{path}"
    return srcUns

def get_src_stats(solutionID: str) -> dict:
    stats = raccoons.SrcStats()
    pathUpsilonGRS = f"/tmp/{solutionID}_src_updates_upsilon_in_grs.dat"
    pathRhoGRS = f"/tmp/{solutionID}_src_updates_rho_in_grs.dat"
    pathUpsilonJORS = f"/tmp/{solutionID}_src_updates_upsilon_in_jors.dat"
    pathRhoJORS = f"/tmp/{solutionID}_src_updates_rho_in_jors.dat"
    srcStats = stats.stats(GLOB[solutionID], pathUpsilonGRS, pathRhoGRS, pathUpsilonJORS, pathRhoJORS)
    srcStats["histUpsilon"] = list(stats.hist_upsilon())
    srcStats["histRho"] = list(stats.hist_rho())
    srcStats["pathUpsilonGRS"] = f"/storage{pathUpsilonGRS}"
    srcStats["pathRhoGRS"] = f"/storage{pathRhoGRS}"
    srcStats["pathUpsilonJORS"] = f"/storage{pathUpsilonJORS}"
    srcStats["pathRhoJORS"] = f"/storage{pathRhoJORS}"
    PUBLISH_FILE(pathUpsilonGRS)
    PUBLISH_FILE(pathRhoGRS)
    PUBLISH_FILE(pathUpsilonJORS)
    PUBLISH_FILE(pathRhoJORS)
    return srcStats

def assemble_hist(detector, minMax, binCenters, bins, nameHist):
    detector[nameHist] = []
    for x, y in zip(binCenters, bins):
        detector[nameHist].append(x)
        detector[nameHist].append(y)
        if x < minMax["minX"]:
            minMax["minX"] = x
        if x > minMax["maxX"]:
            minMax["maxX"] = x
        if y < minMax["minY"]:
            minMax["minY"] = y
        if y > minMax["maxY"]:
            minMax["maxY"] = y

def make_hist(detector, minMax, name, studentised):
    nameHist = name + "Hist"
    nameBinCenters = name + "BinCenters"
    nameBins = name + "Bins"
    nameGaussS1 = name + "GaussS1"
    nameGauss = name + "Gauss"

    binCenters = np.array(detector[nameBinCenters])
    bins = np.array(detector[nameBins])

    maxBins = max(bins)
    sumBins = sum(bins)
    meanBins = sum(binCenters * bins) / sumBins
    sigmaBins = np.sqrt(sum(bins * (binCenters - meanBins) ** 2) / sumBins)

    assemble_hist(detector, minMax, binCenters, bins, nameHist)

    if studentised:
        popt, pcov = curve_fit(gaussS1, binCenters, bins, p0 = [ maxBins ])
        gs1 = gaussS1(binCenters, *popt)
        assemble_hist(detector, minMax, binCenters, gs1, nameGaussS1)

    popt, pcov = curve_fit(gauss, binCenters, bins, p0 = [ maxBins, meanBins, sigmaBins ])
    gs = gauss(binCenters, *popt)
    assemble_hist(detector, minMax, binCenters, gs, nameGauss)

    detector[name + "Thickness"] = (max(binCenters) - min(binCenters)) / 50

    del detector[nameBinCenters]
    del detector[nameBins]

def get_res_stats(solutionID: str, studentised: bool) -> dict:
    stats = raccoons.ResStats().stats(GLOB[solutionID], 50, studentised)
    stats["minX"] = 1.0e100
    stats["maxX"] = -1.0e100
    stats["minY"] = 1.0e100
    stats["maxY"] = -1.0e100
    for detector in stats["detectors"]:
        make_hist(detector, stats, "eta", studentised)
        make_hist(detector, stats, "zeta", studentised)
    return stats

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
