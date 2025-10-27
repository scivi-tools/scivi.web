
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

            resHistogramSpringEta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Eta, binNum, True, False)
            resHistogramSpringZeta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Zeta, binNum, True, False)
            studResHistogramSpringEta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Eta, binNum, True, True)
            studResHistogramSpringZeta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Zeta, binNum, True, True)

            resHistogramAutumnEta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Eta, binNum, False, False)
            resHistogramAutumnZeta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Zeta, binNum, False, False)
            studResHistogramAutumnEta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Eta, binNum, False, True)
            studResHistogramAutumnZeta = raccoons.ResHistogramSeasons(raccoons.Coordinate.Zeta, binNum, False, True)

            query = [
                countObsPerSource,
                countObsPerUnit,

                resHistogramEta,
                resHistogramZeta,
                studResHistogramEta,
                studResHistogramZeta,

                resHistogramSpringEta,
                resHistogramSpringZeta,
                studResHistogramSpringEta,
                studResHistogramSpringZeta,

                resHistogramAutumnEta,
                resHistogramAutumnZeta,
                studResHistogramAutumnEta,
                studResHistogramAutumnZeta
            ]

            resPhaseEta = []
            resPhaseZeta = []
            studResPhaseEta = []
            studResPhaseZeta = []
            phaseTicks = []
            for i in range(9):
                startPhase = i * np.deg2rad(20.0)
                endPhase = (i + 1) * np.deg2rad(20.0)
                phaseTicks.append(f"[{i * 20}&deg;; {(i + 1) * 20}&deg;]")
                resPhaseEta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                              binNum, startPhase, endPhase, False))
                resPhaseZeta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                               binNum, startPhase, endPhase, False))
                studResPhaseEta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                                  binNum, startPhase, endPhase, True))
                studResPhaseZeta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                                   binNum, startPhase, endPhase, True))
            query += resPhaseEta + resPhaseZeta + studResPhaseEta + studResPhaseZeta

            self.engine.for_each_observation(query)

            self.report["missionOvervew"] = self.engine.mission_overview()

            self.report["solutionStats"] = self.engine.solution_stats()

            self.report["sanityChecks"] = {
                "calibUnits": int(countObsPerUnit.min() > 0),
                "sources": int(countObsPerSource.min() > 0),
                "spectrum": int(np.round(np.sum(np.fromfile(os.path.join(self.engine.solution_path(), "spectrum.dat"),
                                                            dtype = np.double))) ==
                                self.report["missionOvervew"]["m"])
            }

            self.report["observationsStats"] = {
                "min": countObsPerSource.min(),
                "max": countObsPerSource.max(),
                "avg": countObsPerSource.avg(),
                "hist": list(countObsPerSource.histogram(binNum))
            }

            pathNonGaia = os.path.join(cachePath, solutionID + "_obs_per_src_non_gaia.dat")
            pathGaia = os.path.join(cachePath, solutionID + "_obs_per_src_gaia.dat")
            self.report["observationsPerSource"] = countObsPerSource.dump_to_file(pathNonGaia, pathGaia)
            self.report["observationsPerSource"]["pathNonGaia"] = pathNonGaia
            self.report["observationsPerSource"]["pathGaia"] = pathGaia

            stats = raccoons.SrcStats()
            pathUpsilonNonGaiaGRS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_non_gaia_in_grs.dat")
            pathUpsilonGaiaGRS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_gaia_in_grs.dat")
            pathRhoNonGaiaGRS = os.path.join(cachePath, solutionID + "_src_updates_rho_non_gaia_in_grs.dat")
            pathRhoGaiaGRS = os.path.join(cachePath, solutionID + "_src_updates_rho_gaia_in_grs.dat")
            pathUpsilonNonGaiaJORS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_non_gaia_in_jors.dat")
            pathUpsilonGaiaJORS = os.path.join(cachePath, solutionID + "_src_updates_upsilon_gaia_in_jors.dat")
            pathRhoNonGaiaJORS = os.path.join(cachePath, solutionID + "_src_updates_rho_non_gaia_in_jors.dat")
            pathRhoGaiaJORS = os.path.join(cachePath, solutionID + "_src_updates_rho_gaia_in_jors.dat")
            srcStats = stats.stats(self.engine,
                                   pathUpsilonNonGaiaGRS, pathUpsilonGaiaGRS,
                                   pathRhoNonGaiaGRS, pathRhoGaiaGRS,
                                   pathUpsilonNonGaiaJORS, pathUpsilonGaiaJORS,
                                   pathRhoNonGaiaJORS, pathRhoGaiaJORS)
            srcStats["minX"] = 1.0e100
            srcStats["maxX"] = -1.0e100
            srcStats["minY"] = 1.0e100
            srcStats["maxY"] = -1.0e100
            self.make_hist(srcStats, srcStats, "upsilonNonGaia", True, False)
            self.make_hist(srcStats, srcStats, "rhoNonGaia", True, False)
            self.make_hist(srcStats, srcStats, "upsilonGaia", False, False)
            self.make_hist(srcStats, srcStats, "rhoGaia", False, False)
            srcStats["pathUpsilonNonGaiaGRS"] = pathUpsilonNonGaiaGRS
            srcStats["pathUpsilonGaiaGRS"] = pathUpsilonGaiaGRS
            srcStats["pathRhoNonGaiaGRS"] = pathRhoNonGaiaGRS
            srcStats["pathRhoGaiaGRS"] = pathRhoGaiaGRS
            srcStats["pathUpsilonNonGaiaJORS"] = pathUpsilonNonGaiaJORS
            srcStats["pathUpsilonGaiaJORS"] = pathUpsilonGaiaJORS
            srcStats["pathRhoNonGaiaJORS"] = pathRhoNonGaiaJORS
            srcStats["pathRhoGaiaJORS"] = pathRhoGaiaJORS
            self.report["srcStats"] = srcStats

            N = self.report["missionOvervew"]["N"]
            detectorNames = [ "CMOS0", "CMOS1", "CMOS2", "CMOS3" ];
            self.report["resStats"] = {
                "subsets": [
                    {
                        "name": "All",
                        "slices": []
                    },
                    {
                        "name": "Season",
                        "dimensions": [ { "name": "Timespan", "ticks": [ "Spring", "Autumn" ] } ],
                        "slices": []
                    },
                    {
                        "name": "Phase",
                        "dimensions": [ { "name": "Phase", "ticks": phaseTicks } ],
                        "slices": []
                    }
                ],
                "minX": 1.0e100,
                "maxX": -1.0e100,
                "minY": 1.0e100,
                "maxY": -1.0e100
            }
            self.report["studResStats"] = {
                "subsets": [
                    {
                        "name": "All",
                        "slices": []
                    },
                    {
                        "name": "Season",
                        "dimensions": [ { "name": "Timespan", "ticks": [ "Spring", "Autumn" ] } ],
                        "slices": []
                    },
                    {
                        "name": "Phase",
                        "dimensions": [ { "name": "Phase", "ticks": phaseTicks } ],
                        "slices": []
                    }
                ],
                "minX": 1.0e100,
                "maxX": -1.0e100,
                "minY": 1.0e100,
                "maxY": -1.0e100
            }

            # All
            self.reasiduals_subset_slice(self.report["resStats"], self.report["studResStats"], 0,
                                         N, detectorNames,
                                         resHistogramEta, resHistogramZeta,
                                         studResHistogramEta, studResHistogramZeta)

            # Spring
            self.reasiduals_subset_slice(self.report["resStats"], self.report["studResStats"], 1,
                                         N, detectorNames,
                                         resHistogramSpringEta, resHistogramSpringZeta,
                                         studResHistogramSpringEta, studResHistogramSpringZeta)
            # Autumn
            self.reasiduals_subset_slice(self.report["resStats"], self.report["studResStats"], 1,
                                         N, detectorNames,
                                         resHistogramAutumnEta, resHistogramAutumnZeta,
                                         studResHistogramAutumnEta, studResHistogramAutumnZeta)
            # Phase
            for i in range(len(resPhaseEta)):
                self.reasiduals_subset_slice(self.report["resStats"], self.report["studResStats"], 2,
                                             N, detectorNames,
                                             resPhaseEta[i], resPhaseZeta[i],
                                             studResPhaseEta[i], studResPhaseZeta[i])


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

    def make_hist(self, hist, stats, name, fitGauss, fitGaussS1):
        nameHist = name + "Hist"
        nameBinCenters = name + "BinCenters"
        nameBins = name + "Bins"

        binCenters = np.array(hist[nameBinCenters])
        bins = np.array(hist[nameBins])

        maxBins = max(bins)
        sumBins = sum(bins)
        if sumBins > 0.0:
            meanBins = sum(binCenters * bins) / sumBins
            sigmaBins = np.sqrt(sum(bins * (binCenters - meanBins) ** 2) / sumBins)
        else:
            meanBins = 0.0
            sigmaBins = 0.0

        self.assemble_hist(hist, stats, binCenters, bins, nameHist)

        if fitGauss:
            nameGauss = name + "Gauss"
            if sumBins > 0.0:
                popt, pcov = curve_fit(self.gauss, binCenters, bins, p0 = [ maxBins, meanBins, sigmaBins ])
                stats[name + "GaussSigma"] = popt[2]
                gs = self.gauss(binCenters, *popt)
            else:
                stats[name + "GaussSigma"] = 0
                gs = np.zeros(len(binCenters))
            self.assemble_hist(hist, stats, binCenters, gs, nameGauss)

        if fitGaussS1:
            nameGaussS1 = name + "GaussS1"
            if sumBins > 0.0:
                popt, pcov = curve_fit(self.gaussS1, binCenters, bins, p0 = [ maxBins ])
                gs1 = self.gaussS1(binCenters, *popt)
            else:
                gs1 = np.zeros(len(binCenters))
            self.assemble_hist(hist, stats, binCenters, gs1, nameGaussS1)

        del hist[nameBinCenters]
        del hist[nameBins]

    def process_detector(self, n, names, histEta, histZeta):
        return {
            "name": names[n],
            "count": histEta.count(n),

            "etaMu": histEta.mean(n),
            "etaSigma": histEta.st_dev(n),
            "etaGamma": histEta.skewness(n),
            "etaKappa": histEta.kurtosis(n),
            "etaBins": histEta.bins(n),
            "etaBinCenters": histEta.bin_centers(n),

            "zetaMu": histZeta.mean(n),
            "zetaSigma": histZeta.st_dev(n),
            "zetaGamma": histZeta.skewness(n),
            "zetaKappa": histZeta.kurtosis(n),
            "zetaBins": histZeta.bins(n),
            "zetaBinCenters": histZeta.bin_centers(n)
        }

    def reasiduals_subset_slice(self,
                                stats, studStats, subsetIdx,
                                N, detectorNames, histEta, histZeta, studHistEta, studHistZeta):
        subsetSlice = { "detectors": [] }
        studSubsetSlice = { "detectors": [] }
        stats["subsets"][subsetIdx]["slices"].append(subsetSlice)
        studStats["subsets"][subsetIdx]["slices"].append(studSubsetSlice)

        for n in range(N):
            detector = self.process_detector(n, detectorNames, histEta, histZeta)
            self.make_hist(detector, stats, "eta", True, False)
            self.make_hist(detector, stats, "zeta", True, False)
            subsetSlice["detectors"].append(detector)

            detector = self.process_detector(n, detectorNames, studHistEta, studHistZeta)
            self.make_hist(detector, studStats, "eta", True, True)
            self.make_hist(detector, studStats, "zeta", True, True)
            studSubsetSlice["detectors"].append(detector)

    def get_obs_of_src(self, srcID, isJORS, path):
        getter = raccoons.ObsGetter()
        return getter.get_obs_of_src(srcID, isJORS, path, self.engine)
