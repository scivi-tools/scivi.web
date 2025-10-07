
import lib.ajas.raccoons as raccoons
import numpy as np
import os
import json
from scipy.optimize import curve_fit


class Report:
    def __init__(self, solutionID, inputPath, solutionPath, cachePath):
        self.solutionID = solutionID
        self.engine = raccoons.Engine(inputPath + "/obs.dat", inputPath + "/src.dat", solutionPath)

        cacheFile = os.path.join(cachePath, solutionID + "_report.json")
        if os.path.isfile(cacheFile):
            with open(cacheFile) as f:
                self.report = json.load(f)
        else:
            self.report = {}
            binNum = 50

            countObsPerSource = raccoons.CountObsPerSource()
            countObsPerUnit = raccoons.CountObsPerUnit()
            resHistogramEta = raccoons.ResHistogram(raccoons.Coordinate.Eta, binNum, False)
            resHistogramZeta = raccoons.ResHistogram(raccoons.Coordinate.Zeta, binNum, False)
            studResHistogramEta = raccoons.ResHistogram(raccoons.Coordinate.Eta, binNum, True)
            studResHistogramZeta = raccoons.ResHistogram(raccoons.Coordinate.Zeta, binNum, True)
            self.engine.for_each_observation([ \
                countObsPerSource, \
                countObsPerUnit, \
                resHistogramEta, \
                resHistogramZeta, \
                studResHistogramEta, \
                studResHistogramZeta \
            ])

            self.report["missionOvervew"] = self.engine.mission_overview()

            self.report["solutionStats"] = self.engine.solution_stats()

            self.report["sanityChecks"] = { \
                "calibUnits": int(countObsPerUnit.min() > 0), \
                "sources": int(countObsPerSource.min() > 0), \
                "spectrum": int(np.round(np.sum(np.fromfile(os.path.join(self.engine.solution_path(), "spectrum.dat"), \
                                                            dtype = np.double))) == \
                                self.report["missionOvervew"]["m"]) \
            }

            self.report["observationsStats"] = { \
                "min": countObsPerSource.min(), \
                "max": countObsPerSource.max(), \
                "avg": countObsPerSource.avg(), \
                "hist": list(countObsPerSource.histogram(binNum)) \
            }

            path = os.path.join(cachePath, solutionID + "_obs_per_src.dat")
            self.report["observationsPerSource"] = countObsPerSource.dump_to_file(path)
            self.report["observationsPerSource"]["path"] = path

            stats = raccoons.SrcStats()
            pathUpsilonGRS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_in_grs.dat")
            pathRhoGRS = os.path.join(cachePath, solutionID + "_src_updates_rho_in_grs.dat")
            pathUpsilonJORS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_in_jors.dat")
            pathRhoJORS = os.path.join(cachePath, solutionID + "_src_updates_rho_in_jors.dat")
            srcStats = stats.stats(self.engine, pathUpsilonGRS, pathRhoGRS, pathUpsilonJORS, pathRhoJORS)
            srcStats["minX"] = 1.0e100
            srcStats["maxX"] = -1.0e100
            srcStats["minY"] = 1.0e100
            srcStats["maxY"] = -1.0e100
            self.make_hist(srcStats, srcStats, "upsilonNonGaia", True, False)
            self.make_hist(srcStats, srcStats, "rhoNonGaia", True, False)
            self.make_hist(srcStats, srcStats, "upsilonGaia", False, False)
            self.make_hist(srcStats, srcStats, "rhoGaia", False, False)
            srcStats["pathUpsilonGRS"] = pathUpsilonGRS
            srcStats["pathRhoGRS"] = pathRhoGRS
            srcStats["pathUpsilonJORS"] = pathUpsilonJORS
            srcStats["pathRhoJORS"] = pathRhoJORS
            self.report["srcStats"] = srcStats

            N = self.report["missionOvervew"]["N"]
            detectorNames = [ "CMOS0", "CMOS1", "CMOS2", "CMOS3" ];
            self.report["resStats"] = { \
                "detectors": [], \
                "minX": 1.0e100, \
                "maxX": -1.0e100, \
                "minY": 1.0e100, \
                "maxY": -1.0e100 \
            }
            self.report["studResStats"] = { \
                "detectors": [], \
                "minX": 1.0e100, \
                "maxX": -1.0e100, \
                "minY": 1.0e100, \
                "maxY": -1.0e100 \
            }
            for n in range(N):
                detector = self.process_detector(n, detectorNames, resHistogramEta, resHistogramZeta)
                self.make_hist(detector, self.report["resStats"], "eta", True, False)
                self.make_hist(detector, self.report["resStats"], "zeta", True, False)
                self.report["resStats"]["detectors"].append(detector)

                detector = self.process_detector(n, detectorNames, studResHistogramEta, studResHistogramZeta)
                self.make_hist(detector, self.report["studResStats"], "eta", True, True)
                self.make_hist(detector, self.report["studResStats"], "zeta", True, True)
                self.report["studResStats"]["detectors"].append(detector)

            with open(cacheFile, "w") as f:
                json.dump(self.report, f)

    def mission_overview(self):
        return self.report["missionOvervew"]

    def solution_stats(self):
        return self.report["solutionStats"]

    def sanity_checks(self):
        return self.report["sanityChecks"]

    def observations_stats(self):
        return self.report["observationsStats"]

    def observations_per_source(self):
        return self.report["observationsPerSource"]

    def src_stats(self):
        return self.report["srcStats"]

    def res_stats(self, studentised):
        if studentised:
            return self.report["studResStats"]
        else:
            return self.report["resStats"]

    def gauss(self, x, a, x0, sigma):
        return a * np.exp(-(x - x0) ** 2 / (2 * sigma ** 2))

    def gaussS1(self, x, a):
        return a * np.exp(-x ** 2 / 2)

    def assemble_hist(self, hist, minMax, binCenters, bins, nameHist):
        hist[nameHist] = []
        for x, y in zip(binCenters, bins):
            hist[nameHist].append(x)
            hist[nameHist].append(y)
            if x < minMax["minX"]:
                minMax["minX"] = x
            if x > minMax["maxX"]:
                minMax["maxX"] = x
            if y < minMax["minY"]:
                minMax["minY"] = y
            if y > minMax["maxY"]:
                minMax["maxY"] = y

    def make_hist(self, hist, minMax, name, fitGauss, fitGaussS1):
        nameHist = name + "Hist"
        nameBinCenters = name + "BinCenters"
        nameBins = name + "Bins"

        binCenters = np.array(hist[nameBinCenters])
        bins = np.array(hist[nameBins])

        maxBins = max(bins)
        sumBins = sum(bins)
        meanBins = sum(binCenters * bins) / sumBins
        sigmaBins = np.sqrt(sum(bins * (binCenters - meanBins) ** 2) / sumBins)

        self.assemble_hist(hist, minMax, binCenters, bins, nameHist)

        if fitGauss:
            nameGauss = name + "Gauss"
            popt, pcov = curve_fit(self.gauss, binCenters, bins, p0 = [ maxBins, meanBins, sigmaBins ])
            gs = self.gauss(binCenters, *popt)
            self.assemble_hist(hist, minMax, binCenters, gs, nameGauss)

        if fitGaussS1:
            nameGaussS1 = name + "GaussS1"
            popt, pcov = curve_fit(self.gaussS1, binCenters, bins, p0 = [ maxBins ])
            gs1 = self.gaussS1(binCenters, *popt)
            self.assemble_hist(hist, minMax, binCenters, gs1, nameGaussS1)

        del hist[nameBinCenters]
        del hist[nameBins]

    def process_detector(self, n, names, histEta, histZeta):
        return { \
            "name": names[n], \
            "count": histEta.count(n), \

            "etaMu": histEta.mean(n), \
            "etaSigma": histEta.st_dev(n), \
            "etaGamma": histEta.skewness(n), \
            "etaKappa": histEta.kurtosis(n), \
            "etaBins": histEta.bins(n), \
            "etaBinCenters": histEta.bin_centers(n), \

            "zetaMu": histZeta.mean(n), \
            "zetaSigma": histZeta.st_dev(n), \
            "zetaGamma": histZeta.skewness(n), \
            "zetaKappa": histZeta.kurtosis(n), \
            "zetaBins": histZeta.bins(n), \
            "zetaBinCenters": histZeta.bin_centers(n) \
        }
