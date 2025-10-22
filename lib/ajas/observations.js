
async function buildStats(solutionID)
{
    const stats = await get_observations_stats(solutionID);
    const obsPerSrc = await get_observations_per_source(solutionID);
    let bullet = 1;
    const html = `
        <h2>Observational Statistics</h2>
        <div class="report-dashrow">
            <div class="report-dashbox">
                <h3>Observations per Source</h3>
                <table>
                    <tr>
                        <td>${bullet++}.</td>
                        <td>min</td>
                        <td class="table-num">${stats["min"]}</td>
                    </tr>
                    <tr>
                        <td>${bullet++}.</td>
                        <td>max</td>
                        <td class="table-num">${stats["max"]}</td>
                    </tr>
                    <tr>
                        <td>${bullet++}.</td>
                        <td>avg</td>
                        <td class="table-num">${stats["avg"].toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            <div class="report-dashbox">
                <h3>Observations per Source Distribution</h3>
                <div onclick="NChart3DLib.chart.obsPerSrcHist();">
                    <canvas id="obsPerSrcHist" style="width: ${ReportHelpers.calcChartWidth(2, 1, 300)}px; height: 400px;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Observations per Source Map</h3>
                <div onclick="NChart3DLib.chart.obsPerSrcScatter();">
                    <canvas id="obsPerSrcScatter" style="width: ${ReportHelpers.calcChartWidth(2, 1, 300)}px; height: 400px;"></canvas>
                </div>
            </div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_TAB(report, "Observations");

    await ReportHelpers.createChart((chart) => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption:
                    {
                        text: "Observations / Source",
                        font: { size: 16 }
                    },
                    valueMask: "%.0f",
                    shouldBeautifyMinAndMax: false,
                    font: { size: 16 }
                },
                yAxis:
                {
                    caption:
                    {
                        text: "Log(Amount)",
                        font: { size: 16 }
                    },
                    isLogarithmic: true,
                    valueMask: "%.1e",
                    font: { size: 16 }
                },
                margin: [ 0, 0, 0, 0 ]
            },
            caption: { visible: false },
            shouldAntialias: false,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "column",
                    brush: "#60cce8",
                    borderBrush: "#000000",
                    borderThickness: 1,
                    points:
                    {
                        type: "xy",
                        data: stats["hist"]
                    }
                }
            ]
        };
        chart.obsPerSrcHist = () => {
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            chartConfig.caption = { visible: true, text: "Observations per Source Distribution" };
            chartConfig.series[0].name = "Observations per Source";
            SCIVI.forkWithTemplate(ReportHelpers.histogramTemplate(chartConfig, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, "obsPerSrcHist");
    });

    await ReportHelpers.createChart((chart) => {
        const scale = {
            brushes: [ "#E40303", "#FF8C00", "#FFD000", "#00CF3D", "#0072FF", "#000000" ],
            values:
            [
                stats["min"],
                stats["min"] + 0.25 * (stats["max"] - stats["min"]),
                stats["min"] + 0.5 * (stats["max"] - stats["min"]),
                stats["min"] + 0.75 * (stats["max"] - stats["min"]),
                stats["max"]
            ],
            isGradient: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "Galactic Longitude [deg]" },
                    minValue: Math.round(obsPerSrc["minL"]),
                    maxValue: Math.round(obsPerSrc["maxL"]),
                    valueMask: "%.2f",
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    caption: { text: "Galactic Latitude [deg]" },
                    minValue: Math.round(obsPerSrc["minB"]),
                    maxValue: Math.round(obsPerSrc["maxB"]),
                    valueMask: "%.2f",
                    isLogarithmic: false,
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                sameResolution: true,
                sameResolutionStickY: "top"
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
                                data: obsPerSrc["pathNonGaia"]
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
                                data: obsPerSrc["pathGaia"]
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
                        data: [ -1.4, -0.6, -1.4, 0.6, 0.7, 0.6, 0.7, -0.6, -1.4, -0.6, -1.4, 0.0 ]
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
                    markerSize: [ 10, 10 ],
                    isContinuous: true,
                    margin: [ 60, 15, 0, 0 ]
                }
            ]
        };
        chart.obsPerSrcScatter = () => {
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
            chartConfig.caption = { visible: true, text: "Observations per Source Map" };
            chartConfig.scaleLegends[0].blockAlignment = "right";
            chartConfig.scaleLegends[0].labelPosition = "right";
            delete chartConfig.scaleLegends[0].markerSize;
            delete chartConfig.scaleLegends[0].margin;
            chartConfig.series[0].points.data[0].marker.size = 5;
            chartConfig.series[1].points.data[0].marker.size = 7;
            chartConfig.legend.visible = true;
            SCIVI.forkWithTemplate(ReportHelpers.scatterTemplate(chartConfig, false, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, "obsPerSrcScatter");
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildStats(INPUT["Solution"]);
}
