
async function plotHist(caption, dataNonGaia, dataGaia, thickness, gauss, canvas)
{
    await ReportHelpers.createChart((chart) => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption:
                    {
                        text: caption,
                        font: { size: 16 },
                    },
                    font: { size: 16 },
                    valueMask: "%.3e",
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    caption:
                    {
                        text: "Amount",
                        font: { size: 16 },
                    },
                    font: { size: 16 },
                    valueMask: "%.0f"
                },
                valueAxesType: "additive",
                margin: [ 0, 0, 0, 0 ]
            },
            caption: { visible: false },
            shouldAntialias: true,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "column",
                    brush: "#FF7F7F",
                    borderBrush: "#000000",
                    name: "non-Gaia stars",
                    borderThickness: 1,
                    points:
                    {
                        type: "xy",
                        data: dataNonGaia
                    }
                },
                {
                    type: "column",
                    brush: "#60CCE8",
                    borderBrush: "#000000",
                    name: "Gaia stars",
                    borderThickness: 1,
                    points:
                    {
                        type: "xy",
                        data: dataGaia
                    }
                },
                {
                    type: "line",
                    brush: "#B51700",
                    lineThickness: 3,
                    name: "Gaussian fit to non-Gaia stars",
                    forceAbsolute: true,
                    points:
                    {
                        type: "xy",
                        data: gauss
                    }
                }
            ],
            seriesSettings:
            {
                column:
                {
                    thickness: thickness
                }
            }
        };
        chart[canvas] = () => {
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            chartConfig.caption = { visible: true, text: caption };
            SCIVI.forkWithTemplate(ReportHelpers.histogramTemplate(chartConfig, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, canvas);
    });
}

async function plotMap(caption, dataPathNonGaia, dataPathGaia,
                       minVal, maxVal, minX, maxX, minY, maxY, xAxisName, yAxisName, interestRegion,
                       isJORS, canvas)
{
    await ReportHelpers.createChart((chart) => {
        const scale = {
            brushes: [ "#E40303", "#FF8C00", "#FFD000", "#00CF3D", "#0072FF", "#000000" ],
            minValue: minVal,
            maxValue: maxVal,
            isGradient: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption:
                    {
                        text: xAxisName,
                        font: { size: 12 },
                    },
                    font: { size: 12 },
                    minValue: Math.floor(minX),
                    maxValue: Math.ceil(maxX),
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    caption:
                    {
                        text: yAxisName,
                        font: { size: 12 },
                    },
                    font: { size: 12 },
                    minValue: Math.floor(minY),
                    maxValue: Math.ceil(maxY),
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                sameResolution: true,
                sameResolutionStickY: "top",
                margin: [ 0, 0, 0, 0 ]
            },
            caption: { visible: false },
            shouldAntialias: true,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "scatter",
                    scale: scale,
                    name: "non-Gaia stars",
                    points:
                    {
                        data: [ {
                            marker:
                            {
                                size: 3,
                                elementType: "xyzValue",
                                shape: "circle",
                                data: dataPathNonGaia
                            }
                        } ]
                    }
                },
                {
                    type: "scatter",
                    scale: scale,
                    name: "Gaia stars",
                    points:
                    {
                        data: [ {
                            marker:
                            {
                                size: 4,
                                elementType: "xyzValue",
                                shape: "diamond",
                                data: dataPathGaia
                            }
                        } ]
                    }
                },
                {
                    type: "line",
                    brush: "#B51700",
                    lineThickness: 3,
                    pointSelectionEnabled: false,
                    points:
                    {
                        type: "xy",
                        data: interestRegion
                    }
                }
            ],
            legend: { visible: false },
            scaleLegends:
            [
                {
                    scale: scale,
                    blockAlignment: "top",
                    labelPosition: "bottom",
                    contentAlignment: "left",
                    isContinuous: true,
                    valueMask: "%.3e",
                    markerSize: [ 10, 10 ],
                    font: { size: 12 }
                }
            ]
        };
        chart[canvas] = () => {
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            delete chartConfig.cartesianSystem.sameResolutionStickY;
            chartConfig.shouldAntialias = false;
            chartConfig.seriesSettings = {
                scatter:
                {
                    bloomSizeFactor: 1.5,
                    bloomFallOff: 4,
                    zoomLevelToScale: 4.0,
                    scaleByZoom: 2.0
                }
            };
            chartConfig.caption = { visible: true, text: caption };
            chartConfig.scaleLegends[0].blockAlignment = "right";
            chartConfig.scaleLegends[0].labelPosition = "right";
            delete chartConfig.scaleLegends[0].markerSize;
            delete chartConfig.scaleLegends[0].margin;
            delete chartConfig.cartesianSystem.xAxis.font;
            delete chartConfig.cartesianSystem.xAxis.caption.font;
            delete chartConfig.cartesianSystem.yAxis.font;
            delete chartConfig.cartesianSystem.yAxis.caption.font;
            delete chartConfig.scaleLegends[0].font;
            chartConfig.series[0].points.data[0].marker.size = 5;
            chartConfig.series[1].points.data[0].marker.size = 7;
            chartConfig.legend.visible = true;
            SCIVI.forkWithTemplate(ReportHelpers.scatterTemplate(chartConfig, isJORS, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, canvas);
    });
}

async function buildSources(solutionID)
{
    const stats = await get_src_stats(solutionID);
    const html = `
        <h2>Source Statistics</h2>
        <div class="report-dashrow">
            <div class="report-dashbox">
                <h3>Source Updates Properties [μas]</h3>
                <table>
                    <tr>
                        <td class="table-head">Parameter</td>
                        <td class="table-head">min</td>
                        <td class="table-head">max</td>
                        <td class="table-head">avg</td>
                        <td class="table-head">𝜎 (non-Gaia stars)</td>
                        <td class="table-head">𝜎 (fitted Gaussian)</td>
                    </tr>
                    <tr>
                        <td>𝜐</td>
                        <td class="table-num">${stats["minUpsilonUpdate"].toExponential(3)} ±${stats["minUpsilonUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxUpsilonUpdate"].toExponential(3)} ±${stats["maxUpsilonUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgUpsilonUpdate"].toExponential(3)} ±${stats["avgUpsilonUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["sigmaUpsilonUpdate"].toExponential(3)}</td>
                        <td class="table-num">${stats["limits"]["upsilonNonGaiaGaussSigma"].toExponential(3)}</td>
                    </tr>
                    <tr>
                        <td>𝜌</td>
                        <td class="table-num">${stats["minRhoUpdate"].toExponential(3)} ±${stats["minRhoUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxRhoUpdate"].toExponential(3)} ±${stats["maxRhoUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgRhoUpdate"].toExponential(3)} ±${stats["avgRhoUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["sigmaRhoUpdate"].toExponential(3)}</td>
                        <td class="table-num">${stats["limits"]["rhoNonGaiaGaussSigma"].toExponential(3)}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="report-dashrow" style="margin-top: 20px;">
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜐</h3>
                <div onclick="NChart3DLib.chart.upsilonUpdatesHist();">
                    <canvas id="upsilonUpdatesHist" style="width: ${ReportHelpers.calcChartWidth(2, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜌</h3>
                <div onclick="NChart3DLib.chart.rhoUpdatesHist();">
                    <canvas id="rhoUpdatesHist" style="width: ${ReportHelpers.calcChartWidth(2, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
        </div>
        <div class="report-dashrow" style="margin-top: 20px;">
            <div class="report-dashbox">
                <h3>Updates Map for 𝜐 [μas] in GRS</h3>
                <div onclick="NChart3DLib.chart.upsilonUpdatesGRSMap();">
                    <canvas id="upsilonUpdatesGRSMap" style="width: ${ReportHelpers.calcChartWidth(4, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜌 [μas] in GRS</h3>
                <div onclick="NChart3DLib.chart.rhoUpdatesGRSMap();">
                    <canvas id="rhoUpdatesGRSMap" style="width: ${ReportHelpers.calcChartWidth(4, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜐 [μas] in JORS</h3>
                <div onclick="NChart3DLib.chart.upsilonUpdatesJORSMap();">
                    <canvas id="upsilonUpdatesJORSMap" style="width: ${ReportHelpers.calcChartWidth(4, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜌 [μas] in JORS</h3>
                <div onclick="NChart3DLib.chart.rhoUpdatesJORSMap();">
                    <canvas id="rhoUpdatesJORSMap" style="width: ${ReportHelpers.calcChartWidth(4, 0, 0)}px; height: 400px;"></canvas>
                </div>
            </div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_TAB(report, "Sources");

    const interestRegionGRS = [ -1.4, -0.6, -1.4, 0.6, 0.7, 0.6, 0.7, -0.6, -1.4, -0.6, -1.4, 0.0 ];
    const interestRegionJORS = [ -93.8469643, -30.44350224, -95.02593594, -29.81086853, -93.76201822, -28.02599408, -92.59584878, -28.64766005, -93.84696431, -30.44350224, -94.438338789, -30.12850185 ];

    await plotHist("Update in 𝜐 [μas]",
                   stats["upsilonNonGaiaHist"], stats["upsilonGaiaHist"], stats["upsilonGaiaColumnThickness"],
                   stats["upsilonNonGaiaGauss"],
                   "upsilonUpdatesHist");
    await plotHist("Update in 𝜌 [μas]",
                   stats["rhoNonGaiaHist"], stats["rhoGaiaHist"], stats["rhoGaiaColumnThickness"],
                   stats["rhoNonGaiaGauss"],
                   "rhoUpdatesHist");

    await plotMap("Updates Map for 𝜐 [μas] in GRS",
                  stats["pathUpsilonNonGaiaGRS"], stats["pathUpsilonGaiaGRS"],
                  stats["minUpsilonUpdate"], stats["maxUpsilonUpdate"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "Galactic Longitude [deg]", "Galactic Latitude [deg]",
                  interestRegionGRS, false,
                  "upsilonUpdatesGRSMap");
    await plotMap("Updates Map for 𝜌 [μas] in GRS",
                  stats["pathRhoNonGaiaGRS"], stats["pathRhoGaiaGRS"],
                  stats["minRhoUpdate"], stats["maxRhoUpdate"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "Galactic Longitude [deg]", "Galactic Latitude [deg]",
                  interestRegionGRS, false,
                  "rhoUpdatesGRSMap");
    await plotMap("Updates Map for 𝜐 [μas] in JORS",
                  stats["pathUpsilonNonGaiaJORS"], stats["pathUpsilonGaiaJORS"],
                  stats["minUpsilonUpdate"], stats["maxUpsilonUpdate"],
                  stats["minUpsilon"], stats["maxUpsilon"], stats["minRho"], stats["maxRho"],
                  "JORS 𝜐 [deg]", "JORS 𝜌 [deg]",
                  interestRegionJORS, true,
                  "upsilonUpdatesJORSMap");
    await plotMap("Updates Map for 𝜌 [μas] in JORS",
                  stats["pathRhoNonGaiaJORS"], stats["pathRhoGaiaJORS"],
                  stats["minRhoUpdate"], stats["maxRhoUpdate"],
                  stats["minUpsilon"], stats["maxUpsilon"], stats["minRho"], stats["maxRho"],
                  "JORS 𝜐 [deg]", "JORS 𝜌 [deg]",
                  interestRegionJORS, true,
                  "rhoUpdatesJORSMap");
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildSources(INPUT["Solution"]);
}
