
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
    cvs.width = cvs.clientWidth * cs;
    cvs.height = cvs.clientHeight * cs;
    chart.renderOn2DCanvas(JSON.stringify(config), canvasID, 0, 0, cvs.clientWidth, cvs.clientHeight);
}

function calcChartWidth(numChartsInRow, numOthersInRow, restInRow)
{
    const winPadding = 150 + 10 + 2 + 10 + 2; // actual window padding + dashbox padding left + border + dashbox padding right + border
    const interPadding = 10 + 2 + 20 + 10 + 2; // dashbox padding left + border + gap + dashbox padding right + border
    return Math.floor((window.innerWidth - winPadding -
                       interPadding * (numChartsInRow + numOthersInRow - 1) -
                       restInRow) / numChartsInRow);
}

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
                <div style="width: ${calcChartWidth(2, 1, 300)}px; height: 400px;">
                    <canvas id="obsPerSrcHist" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>Observations per Source Map</h3>
                <div style="width: ${calcChartWidth(2, 1, 300)}px; height: 400px;">
                    <canvas id="obsPerSrcScatter" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    await createChart((chart) => {
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
        renderChart(chart, chartConfig, "obsPerSrcHist");
    });

    await createChart((chart) => {
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
            series:
            [
                {
                    type: "scatter",
                    scale: scale,
                    points:
                    {
                        data: [ { marker: { size: 3, elementType: "xyValue", data: obsPerSrc["path"] } } ]
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
                    markerSize: [ 10, 10 ],
                    isContinuous: true,
                    margin: [ 60, 15, 0, 0 ]
                }
            ]
        };
        renderChart(chart, chartConfig, "obsPerSrcScatter");
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildStats(INPUT["Solution"]);
}
