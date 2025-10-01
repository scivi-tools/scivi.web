
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
    const winPadding = 150 + 20 + 2 + 20 + 2; // actual window padding + dashbox padding left + border + dashbox padding right + border
    const interPadding = 20 + 2 + 20 + 20 + 2; // dashbox padding left + border + gap + dashbox padding right + border
    return Math.floor((window.innerWidth - winPadding -
                       interPadding * (numChartsInRow + numOthersInRow - 1) -
                       restInRow) / numChartsInRow);
}

async function plotHist(caption, data, thickness, canvas)
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
                        font: { size: 10 },
                    },
                    font: { size: 10 },
                    valueMask: "%.3e",
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    caption:
                    {
                        text: "Amount",
                        font: { size: 10 },
                    },
                    font: { size: 10 },
                    valueMask: "%.0f"
                },
                margin: [ 0, 0, 0, 0 ]
            },
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
                        data: data
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

async function plotMap(dataPath, minVal, maxVal, minL, maxL, minB, maxB, canvas)
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
                        text: "Galactic Longitude [deg]",
                        font: { size: 12 },
                    },
                    font: { size: 12 },
                    minValue: Math.round(minL),
                    maxValue: Math.round(maxL),
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    caption:
                    {
                        text: "Galactic Latitude [deg]",
                        font: { size: 12 },
                    },
                    font: { size: 12 },
                    minValue: Math.round(minB),
                    maxValue: Math.round(maxB),
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
                        data: [ -1.4, -0.6, -1.4, 0.6, 0.7, 0.6, 0.7, -0.6, -1.4, -0.6, -1.4, 0.0 ]
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
                        <td class="table-num">${stats["minUpsilon"].toExponential(3)} ±${stats["minUpsilonUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxUpsilon"].toExponential(3)} ±${stats["maxUpsilonUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgUpsilon"].toExponential(3)} ±${stats["avgUpsilonUns"].toExponential(3)}</td>
                    </tr>
                    <tr>
                        <td>𝜌</td>
                        <td class="table-num">${stats["minRho"].toExponential(3)} ±${stats["minRhoUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["maxRho"].toExponential(3)} ±${stats["maxRhoUns"].toExponential(3)}</td>
                        <td class="table-num">${stats["avgRho"].toExponential(3)} ±${stats["avgRhoUns"].toExponential(3)}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="report-dashrow" style="margin-top: 20px;">
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜐</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="upsilonUpdatesHist" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Histogram for 𝜌</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="rhoUpdatesHist" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜐 [μas]</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="upsilonUpdatesMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Updates Map for 𝜌 [μas]</h3>
                <div style="width: ${calcChartWidth(4, 0, 0)}px; height: 400px;">
                    <canvas id="rhoUpdatesMap" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    await plotHist("Update in 𝜐 [μas]",
             stats["histUpsilon"], (stats["maxUpsilon"] - stats["minUpsilon"]) / 50.0,
             "upsilonUpdatesHist");
    await plotHist("Update in 𝜌 [μas]",
             stats["histRho"], (stats["maxRho"] - stats["minRho"]) / 50.0,
             "rhoUpdatesHist");

    await plotMap(stats["pathUpsilon"], stats["minUpsilon"], stats["maxUpsilon"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "upsilonUpdatesMap");
    await plotMap(stats["pathRho"], stats["minRho"], stats["maxRho"],
                  stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
                  "rhoUpdatesMap");
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildSources(INPUT["Solution"]);
}
