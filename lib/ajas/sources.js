
async function createChart(func)
{
    if (!NChart3DLib.chart)
    {
        const mdl = await NChart3DLib();
        NChart3DLib.chart = new mdl.NChart();
    }
    func(NChart3DLib.chart);
}

function renderChart(chart, config, canvasID)
{
    const cvs = document.getElementById(canvasID);
    const cs = window.devicePixelRatio;
    cvs.width = cvs.scrollWidth * cs;
    cvs.height = cvs.scrollHeight * cs;
    chart.renderOn2DCanvas(JSON.stringify(config), canvasID, 0, 0, cvs.scrollWidth, cvs.scrollHeight);
}

function calcChartWidth(numChartsInRow, numOthersInRow, restInRow)
{
    const winPadding = 150 + 10 + 2 + 10 + 2; // actual window padding + dashbox padding left + border + dashbox padding right + border
    const interPadding = 10 + 2 + 20 + 10 + 2; // dashbox padding left + border + gap + dashbox padding right + border
    return Math.floor((window.innerWidth - winPadding -
                       interPadding * (numChartsInRow + numOthersInRow - 1) -
                       restInRow) / numChartsInRow);
}

async function plotHist(caption, dataNonGaia, dataGaia, thickness, gauss, canvas)
{
    await createChart((chart) => {
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
        renderChart(chart, chartConfig, canvas);
    });
}

async function plotMap(dataPath, minVal, maxVal, minX, maxX, minY, maxY, xAxisName, yAxisName, interestRegion, canvas)
{
    await createChart((chart) => {
        const scale = {
            brushes: [ "#E40303", "#FF8C00", "#FFD000", "#00CF3D", "#0072FF", "#000000" ],
            values:
            [
                minVal,
                minVal + 0.25 * (maxVal - minVal),
                minVal + 0.5 * (maxVal - minVal),
                minVal + 0.75 * (maxVal - minVal),
                maxVal
            ],
            font: { size: 12 },
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
            series:
            [
                {
                    type: "scatter",
                    scale: scale,
                    points:
                    {
                        data: [ { marker: { size: 3, elementType: "xyValue", data: dataPath } } ]
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
            seriesSettings:
            {
                scatter:
                {
                    bloomSizeFactor: 1.5,
                    bloomFallOff: 4,
                    zoomLevelToScale: 4.0,
                    scaleByZoom: 2.0
                }
            },
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
        renderChart(chart, chartConfig, canvas);
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
                    </tr>
                    <tr>
                        <td>𝜐</td>
                        <td class="table-num">${stats["minUpsilonUpdate"].toExponential(3)} ±${stats["minUpsilonUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxUpsilonUpdate"].toExponential(3)} ±${stats["maxUpsilonUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgUpsilonUpdate"].toExponential(3)} ±${stats["avgUpsilonUpdateUns"].toExponential(3)}</td>
                    </tr>
                    <tr>
                        <td>𝜌</td>
                        <td class="table-num">${stats["minRhoUpdate"].toExponential(3)} ±${stats["minRhoUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxRhoUpdate"].toExponential(3)} ±${stats["maxRhoUpdateUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgRhoUpdate"].toExponential(3)} ±${stats["avgRhoUpdateUns"].toExponential(3)}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="report-dashrow" style="margin-top: 20px;">
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜐</h3>
                <div style="width: ${calcChartWidth(2, 0, 0)}px; height: 400px;">
                    <canvas id="upsilonUpdatesHist" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜌</h3>
                <div style="width: ${calcChartWidth(2, 0, 0)}px; height: 400px;">
                    <canvas id="rhoUpdatesHist" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        </div>
        <div class="report-dashrow" style="margin-top: 20px;">
            <div class="report-dashbox">
                <h3>Updates Map for 𝜐 [μas] in GRS</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="upsilonUpdatesGRSMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜌 [μas] in GRS</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="rhoUpdatesGRSMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜐 [μas] in JORS</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="upsilonUpdatesJORSMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜌 [μas] in JORS</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="rhoUpdatesJORSMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

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

    await plotMap(stats["pathUpsilonGRS"], stats["minUpsilonUpdate"], stats["maxUpsilonUpdate"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "Galactic Longitude [deg]", "Galactic Latitude [deg]",
                  interestRegionGRS,
                  "upsilonUpdatesGRSMap");
    await plotMap(stats["pathRhoGRS"], stats["minRhoUpdate"], stats["maxRhoUpdate"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "Galactic Longitude [deg]", "Galactic Latitude [deg]",
                  interestRegionGRS,
                  "rhoUpdatesGRSMap");
    await plotMap(stats["pathUpsilonJORS"], stats["minUpsilonUpdate"], stats["maxUpsilonUpdate"],
                  stats["minUpsilon"], stats["maxUpsilon"], stats["minRho"], stats["maxRho"],
                  "JORS 𝜐 [deg]", "JORS 𝜌 [deg]",
                  interestRegionJORS,
                  "upsilonUpdatesJORSMap");
    await plotMap(stats["pathRhoJORS"], stats["minRhoUpdate"], stats["maxRhoUpdate"],
                  stats["minUpsilon"], stats["maxUpsilon"], stats["minRho"], stats["maxRho"],
                  "JORS 𝜐 [deg]", "JORS 𝜌 [deg]",
                  interestRegionJORS,
                  "rhoUpdatesJORSMap");
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildSources(INPUT["Solution"]);
}
