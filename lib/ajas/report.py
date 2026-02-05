
import lib.ajas.raccoons as raccoons
import numpy as np
import os
import json
from scipy.optimize import curve_fit


class Report:
    def __init__(self, solutionID, inputPath, solutionPath, cachePath):
        self.solutionID = solutionID
        self.engine = raccoons.Engine({ "inputPath": inputPath, "outputPath": solutionPath })

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

            resHistogram2DColEta = raccoons.ResHistogram2DCol(raccoons.Coordinate.Eta, 128, 128)
            resHistogram2DColZeta = raccoons.ResHistogram2DCol(raccoons.Coordinate.Zeta, 128, 128)

            resHistogram2DMagEta = raccoons.ResHistogram2DMag(raccoons.Coordinate.Eta, 128, 128)
            resHistogram2DMagZeta = raccoons.ResHistogram2DMag(raccoons.Coordinate.Zeta, 128, 128)

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
                studResHistogramAutumnZeta,

                resHistogram2DColEta,
                resHistogram2DColZeta,

                resHistogram2DMagEta,
                resHistogram2DMagZeta,
            ]

            resPhaseEta = []
            resPhaseZeta = []
            studResPhaseEta = []
            studResPhaseZeta = []
            phaseTicks = []
            for i in range(9):
                startPhase = i * np.deg2rad(20.0)
                endPhase = (i + 1) * np.deg2rad(20.0)
                phaseTicks.append(f"[{i * 20}&deg;; {(i + 1) * 20}&deg;)")
                resPhaseEta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                              binNum, startPhase, endPhase, False))
                resPhaseZeta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Zeta,
                                                               binNum, startPhase, endPhase, False))
                studResPhaseEta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Eta,
                                                                  binNum, startPhase, endPhase, True))
                studResPhaseZeta.append(raccoons.ResHistogramPhase(raccoons.Coordinate.Zeta,
                                                                   binNum, startPhase, endPhase, True))
            query += resPhaseEta + resPhaseZeta + studResPhaseEta + studResPhaseZeta

            resColMagEta = []
            resColMagZeta = []
            studResColMagEta = []
            studResColMagZeta = []
            colorTicks = [ "[-5; 0.57)", "[0.57; 1.23)", "[1.23; 8)" ]
            magnitudeTicks = [ "[10; 13.1)", "[13.1; 13.98)", "[13.98; 15)" ]
            colorEdges = [ -5.0, 0.5653515135036375, 1.2293956601188274, 8.0 ]
            magnitudeEdges = [ 10, 13.09287167663755, 13.978651674833689, 15.0 ]
            for i in range(3):
                startColor = colorEdges[i]
                endColor = colorEdges[i + 1]
                for j in range(3):
                    startMagnitude = magnitudeEdges[j]
                    endMagnitude = magnitudeEdges[j + 1]
                    resColMagEta.append(raccoons.ResHistogramColMag(raccoons.Coordinate.Eta,
                                                                    binNum,
                                                                    startColor, endPhase,
                                                                    startMagnitude, endMagnitude,
                                                                    False))
                    resColMagZeta.append(raccoons.ResHistogramColMag(raccoons.Coordinate.Zeta,
                                                                     binNum,
                                                                     startColor, endPhase,
                                                                     startMagnitude, endMagnitude,
                                                                     False))
                    studResColMagEta.append(raccoons.ResHistogramColMag(raccoons.Coordinate.Eta,
                                                                        binNum,
                                                                        startColor, endPhase,
                                                                        startMagnitude, endMagnitude,
                                                                        True))
                    studResColMagZeta.append(raccoons.ResHistogramColMag(raccoons.Coordinate.Zeta,
                                                                         binNum,
                                                                         startColor, endPhase,
                                                                         startMagnitude, endMagnitude,
                                                                         True))
            query += resColMagEta + resColMagZeta + studResColMagEta + studResColMagZeta

            self.engine.for_each_observation(query)

            ###########
            # Overview
            ###########

            self.report["missionOvervew"] = self.engine.mission_overview()

            self.report["solutionStats"] = self.engine.solution_stats()

            spectrum = raccoons.Spectrum(self.engine)

            self.report["sanityChecks"] = {
                "calibUnits": int(countObsPerUnit.min() > 0),
                "sources": int(countObsPerSource.min() > 0),
                "spectrum": int(np.round(np.sum(spectrum.values())) == self.report["missionOvervew"]["m"])
            }

            self.report["observationsStats"] = {
                "min": countObsPerSource.min(),
                "max": countObsPerSource.max(),
                "avg": countObsPerSource.avg(),
                "hist": list(countObsPerSource.histogram(binNum))
            }

            ###########
            # Observations
            ###########

            pathNonGaia = os.path.join(cachePath, solutionID + "_obs_per_src_non_gaia.dat")
            pathGaia = os.path.join(cachePath, solutionID + "_obs_per_src_gaia.dat")
            self.report["observationsPerSource"] = countObsPerSource.dump_to_file(pathNonGaia, pathGaia)
            self.report["observationsPerSource"]["pathNonGaia"] = pathNonGaia
            self.report["observationsPerSource"]["pathGaia"] = pathGaia

            ###########
            # Sources
            ###########

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
            srcStats["limits"] = self.init_limits()
            self.make_hist(srcStats, srcStats["limits"], "upsilonNonGaia", True, False)
            self.make_hist(srcStats, srcStats["limits"], "rhoNonGaia", True, False)
            self.make_hist(srcStats, srcStats["limits"], "upsilonGaia", False, False)
            self.make_hist(srcStats, srcStats["limits"], "rhoGaia", False, False)
            srcStats["pathUpsilonNonGaiaGRS"] = pathUpsilonNonGaiaGRS
            srcStats["pathUpsilonGaiaGRS"] = pathUpsilonGaiaGRS
            srcStats["pathRhoNonGaiaGRS"] = pathRhoNonGaiaGRS
            srcStats["pathRhoGaiaGRS"] = pathRhoGaiaGRS
            srcStats["pathUpsilonNonGaiaJORS"] = pathUpsilonNonGaiaJORS
            srcStats["pathUpsilonGaiaJORS"] = pathUpsilonGaiaJORS
            srcStats["pathRhoNonGaiaJORS"] = pathRhoNonGaiaJORS
            srcStats["pathRhoGaiaJORS"] = pathRhoGaiaJORS
            self.report["srcStats"] = srcStats

            ###########
            # Residuals
            ###########

            N = self.report["missionOvervew"]["N"]
            detectorNames = [ "CMOS0", "CMOS1", "CMOS2", "CMOS3" ];
            self.report["resStats"] = {
                "subsets": [
                    {
                        "name": "All",
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Season",
                        "dimensions": [ { "name": "Timespan", "ticks": [ "Spring", "Autumn" ] } ],
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Phase",
                        "dimensions": [ { "name": "Phase", "ticks": phaseTicks } ],
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Color & Magnitude",
                        "dimensions":
                        [
                            { "name": "Color", "ticks": colorTicks },
                            { "name": "Magnitude", "ticks": magnitudeTicks }
                        ],
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Color",
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Magnitude",
                        "slices": [],
                        "limits": self.init_limits()
                    }
                ]
            }
            self.report["studResStats"] = {
                "subsets": [
                    {
                        "name": "All",
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Season",
                        "dimensions": [ { "name": "Timespan", "ticks": [ "Spring", "Autumn" ] } ],
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Phase",
                        "dimensions": [ { "name": "Phase", "ticks": phaseTicks } ],
                        "slices": [],
                        "limits": self.init_limits()
                    },
                    {
                        "name": "Color & Magnitude",
                        "dimensions":
                        [
                            { "name": "Color", "ticks": colorTicks },
                            { "name": "Magnitude", "ticks": magnitudeTicks }
                        ],
                        "slices": [],
                        "limits": self.init_limits()
                    }
                ]
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
            # Color & Magnitude
            for i in range(3):
                for j in range(3):
                    idx = i * 3 + j
                    self.reasiduals_subset_slice(self.report["resStats"], self.report["studResStats"], 3,
                                                 N, detectorNames,
                                                 resColMagEta[idx], resColMagZeta[idx],
                                                 studResColMagEta[idx], studResColMagZeta[idx])

            # Color
            self.reasiduals_subset_slice2D(self.report["resStats"], 4,
                                           N, detectorNames,
                                           resHistogram2DColEta, resHistogram2DColZeta,
                                           "color", cachePath, solutionID)

            # Magnitude
            self.reasiduals_subset_slice2D(self.report["resStats"], 5,
                                           N, detectorNames,
                                           resHistogram2DMagEta, resHistogram2DMagZeta,
                                           "magnitude", cachePath, solutionID)

            ###########
            # Low-order calibration
            ###########

            loCalibStats = raccoons.LOCalibStats()

            self.engine.for_each_exposure([ loCalibStats ])

            self.lodMaker = raccoons.LODMaker()

            timestampsPath = os.path.join(cachePath, solutionID + "_exp_timestamps.dat")
            loCalibStats.dump_timestamps(timestampsPath)
            self.report["loCalibStats"] = {
                "timestamps": timestampsPath,
                "params":
                [
                    self.lo_calib_param(loCalibStats, detectorNames, 0, 0, cachePath, solutionID),
                    self.lo_calib_param(loCalibStats, detectorNames, 1, 0, cachePath, solutionID),
                    self.lo_calib_param(loCalibStats, detectorNames, 0, 1, cachePath, solutionID)
                ]
            };

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

    def interleave2(self, arr1, arr2):
        result = np.empty((arr1.size + arr2.size,), dtype = arr1.dtype)
        result[0::2] = arr1
        result[1::2] = arr2
        return result

    def interleave3(self, arr1, arr2, arr3):
        result = np.empty((arr1.size + arr2.size + arr3.size,), dtype = arr1.dtype)
        result[0::3] = arr1
        result[1::3] = arr2
        result[2::3] = arr3
        return result

    def make_hist(self, hist, stats, name, fitGauss, fitGaussS1):
        nameHist = name + "Hist"

        binCenters = np.array(hist[nameHist][0::2])
        binVals = np.array(hist[nameHist][1::2])

        maxBins = max(binVals)
        sumBins = sum(binVals)
        if sumBins > 0.0:
            meanBins = sum(binCenters * binVals) / sumBins
            sigmaBins = np.sqrt(sum(binVals * (binCenters - meanBins) ** 2) / sumBins)
        else:
            meanBins = 0.0
            sigmaBins = 0.0

        hist[nameHist] = list(hist[nameHist])
        stats["minX"] = min(stats["minX"], np.min(binCenters))
        stats["maxX"] = max(stats["maxX"], np.max(binCenters))
        stats["minY"] = min(stats["minY"], np.min(binVals))
        stats["maxY"] = max(stats["maxY"], np.max(binVals))

        if fitGauss:
            nameGauss = name + "Gauss"
            if sumBins > 0.0:
                popt, pcov = curve_fit(self.gauss, binCenters, binVals, p0 = [ maxBins, meanBins, sigmaBins ])
                stats[name + "GaussSigma"] = popt[2]
                gs = self.gauss(binCenters, *popt)
            else:
                stats[name + "GaussSigma"] = 0
                gs = np.zeros(len(binCenters))
            hist[nameGauss] = list(self.interleave2(binCenters, gs))
            stats["minY"] = min(stats["minY"], np.min(gs))
            stats["maxY"] = max(stats["maxY"], np.max(gs))

        if fitGaussS1:
            nameGaussS1 = name + "GaussS1"
            if sumBins > 0.0:
                popt, pcov = curve_fit(self.gaussS1, binCenters, binVals, p0 = [ maxBins ])
                gs1 = self.gaussS1(binCenters, *popt)
            else:
                gs1 = np.zeros(len(binCenters))
            hist[nameGaussS1] = list(self.interleave2(binCenters, gs1))
            stats["minY"] = min(stats["minY"], np.min(gs1))
            stats["maxY"] = max(stats["maxY"], np.max(gs1))

    def process_detector(self, n, names, histEta, histZeta):
        return {
            "name": names[n],
            "count": histEta.count(n),

            "etaMu": histEta.mean(n),
            "etaSigma": histEta.st_dev(n),
            "etaGamma": histEta.skewness(n),
            "etaKappa": histEta.kurtosis(n),
            "etaHist": histEta.bins(n),

            "zetaMu": histZeta.mean(n),
            "zetaSigma": histZeta.st_dev(n),
            "zetaGamma": histZeta.skewness(n),
            "zetaKappa": histZeta.kurtosis(n),
            "zetaHist": histZeta.bins(n)
        }

    def reasiduals_subset_slice(self,
                                stats, studStats, subsetIdx,
                                N, detectorNames, histEta, histZeta, studHistEta, studHistZeta):
        subsetSlice = { "detectors": [], "chart": "column" }
        studSubsetSlice = { "detectors": [], "chart": "column" }
        stats["subsets"][subsetIdx]["slices"].append(subsetSlice)
        studStats["subsets"][subsetIdx]["slices"].append(studSubsetSlice)
        limits = stats["subsets"][subsetIdx]["limits"]
        studLimits = studStats["subsets"][subsetIdx]["limits"]

        for n in range(N):
            detector = self.process_detector(n, detectorNames, histEta, histZeta)
            self.make_hist(detector, limits, "eta", True, False)
            self.make_hist(detector, limits, "zeta", True, False)
            subsetSlice["detectors"].append(detector)

            detector = self.process_detector(n, detectorNames, studHistEta, studHistZeta)
            self.make_hist(detector, studLimits, "eta", True, True)
            self.make_hist(detector, studLimits, "zeta", True, True)
            studSubsetSlice["detectors"].append(detector)

    def process_detector2D(self, n, names, histEta, histZeta, histEtaFile, histZetaFile):
        return {
            "name": names[n],

            "eta": histEtaFile,
            "etaMin": histEta.bin_min(n),
            "etaMax": histEta.bin_max(n),

            "zeta": histZetaFile,
            "zetaMin": histZeta.bin_min(n),
            "zetaMax": histZeta.bin_max(n)
        }

    def reasiduals_subset_slice2D(self,
                                  stats, subsetIdx,
                                  N, detectorNames, histEta, histZeta,
                                  sliceID, cachePath, solutionID):
        subsetSlice = { "detectors": [], "chart": "heatmap" }
        stats["subsets"][subsetIdx]["slices"].append(subsetSlice)

        for n in range(N):
            histEtaFile = os.path.join(cachePath, f"{solutionID}_{sliceID}_cmos{n}_eta.dat")
            histZetaFile = os.path.join(cachePath, f"{solutionID}_{sliceID}_cmos{n}_zeta.dat")
            subsetSlice["detectors"].append(self.process_detector2D(n, detectorNames, histEta, histZeta,
                                                                    histEtaFile, histZetaFile))
            histEta.bins(n).tofile(histEtaFile)
            histZeta.bins(n).tofile(histZetaFile)

    def get_obs_of_src(self, srcID, isJORS, path):
        getter = raccoons.ObsGetter()
        return getter.get_obs_of_src(srcID, isJORS, path, self.engine)

    def lo_calib_param(self, loCalibStats, detectorNames, r, s, cachePath, solutionID):
        detectors = []
        for n in range(len(detectorNames)):
            detectors.append(self.lo_calib_param_detector(loCalibStats, detectorNames[n], n, r, s, cachePath, solutionID))
        return {
            "name": f"{r}{s}",
            "detectors": detectors
        }

    def lo_calib_param_detector(self, loCalibStats, name, n, r, s, cachePath, solutionID):
        etaValues = loCalibStats.low_order_param_values(raccoons.Coordinate.Eta, n, r + s, s)
        zetaValues = loCalibStats.low_order_param_values(raccoons.Coordinate.Zeta, n, r + s, s)
        etaFit, etaResiduals = self.fit_lo_calib(etaValues)
        zetaFit, zetaResiduals = self.fit_lo_calib(zetaValues)
        return {
            "name": name,
            "etaValues": self.make_lods(etaValues, cachePath, f"{solutionID}_lod_{r}{s}_{name}_eta", self.make_lod_data_envelope),
            "zetaValues": self.make_lods(zetaValues, cachePath, f"{solutionID}_lod_{r}{s}_{name}_zeta", self.make_lod_data_envelope),
            "etaFit": self.make_lods(etaFit, cachePath, f"{solutionID}_lod_{r}{s}_{name}_eta_fit", self.make_lod_data_average),
            "zetaFit": self.make_lods(zetaFit, cachePath, f"{solutionID}_lod_{r}{s}_{name}_zeta_fit", self.make_lod_data_average),
            "etaResiduals": self.make_lods(etaResiduals, cachePath, f"{solutionID}_lod_{r}{s}_{name}_eta_res", self.make_lod_data_envelope),
            "zetaResiduals": self.make_lods(zetaResiduals, cachePath, f"{solutionID}_lod_{r}{s}_{name}_zeta_res", self.make_lod_data_envelope)
        }

    def fit_lo_calib_func(self, x, a, b, c, d, e):
        return a * x + b + c * np.sin(d * x + e)

    def fit_lo_calib_init_guess(self):
        return [ 0.0, 0.0, 0.0, 0.0, 0.0 ]

    def fit_lo_calib(self, values):
        x = np.arange(len(values))
        popt, pcov = curve_fit(self.fit_lo_calib_func, x, values, p0 = self.fit_lo_calib_init_guess())
        fit = self.fit_lo_calib_func(x, *popt)
        residuals = values - fit
        return fit, residuals

    def make_lod_data_envelope(self, values, numPointsToAggregate):
        if numPointsToAggregate == 1:
            x = np.arange(len(values), dtype = np.double)
            y = values
            return self.interleave2(x, y)
        else:
            return self.lodMaker.aggregate_envelope(numPointsToAggregate, values)

    def make_lod_data_average(self, values, numPointsToAggregate):
        if numPointsToAggregate == 1:
            x = np.arange(len(values), dtype = np.double)
            y = values
            return self.interleave2(x, y)
        else:
            return self.lodMaker.aggregate_mean(numPointsToAggregate, values)

    def make_lod_name(self, numPointsToAggregate):
        if numPointsToAggregate == 1:
            return "Level of detail: all points"
        else:
            return f"Level of detail: each {numPointsToAggregate} points aggregated"

    def make_lod(self, values, numPointsToAggregate, zoom, cachePath, tag, aggregationFunc):
        lodData = aggregationFunc(values, numPointsToAggregate)
        lodPath = os.path.join(cachePath, f"{tag}_{zoom}.dat")
        lodData.tofile(lodPath)
        return {
            "zoom": zoom,
            "data": lodPath,
            "name": self.make_lod_name(numPointsToAggregate)
        }

    def make_lods(self, values, cachePath, tag, aggregationFunc):
        n = 5
        z = np.geomspace(1.0, len(values) / 100.0, n)
        result = []
        for i in range(n):
            result.append(self.make_lod(values, int(z[n - i - 1]), z[i], cachePath, tag, aggregationFunc))
        return result

    def get_lo_calib_stats(self):
        return self.report["loCalibStats"]

    def init_limits(self):
        return {
            "minX": 1.0e100,
            "maxX": -1.0e100,
            "minY": 1.0e100,
            "maxY": -1.0e100
        }
