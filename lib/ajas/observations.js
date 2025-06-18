
async function buildStats(solutionID)
{
    const stats = await get_observations_stats(solutionID);
    const obsPerSrc = await get_observations_per_source(solutionID);
    let bullet = 1;
    const html = `
        <h2>Observational Statistics</h2>
        <h3>Observations per source</h3>
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
        <div style="width: 50%; height: 400px; margin: 50px 50px 50px 25px;">
            <canvas id="obsPerSrcHist" style="width: 100%; height: 100%;"></canvas>
        </div>
        <div style="width: 50%; height: 400px; margin: 50px 50px 50px 25px;">
            <canvas id="obsPerSrcScatter" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    NChart3DLib().then(mdl => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis: { caption: { text: "Observations / Source" } },
                yAxis: { caption: { text: "Log(Amount)" }, isLogarithmic: true }
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
                        data: stats["hist"]
                    }
                }
            ]
        };
        const chart = new mdl.NChart("obsPerSrcHist");
        chart.loadJSON(JSON.stringify(chartConfig));
    });

    NChart3DLib().then(mdl => {
        const scale = {
            brushes: [ "#ff0000", "#00ff00", "#0000ff", "#0000ff" ],
            values: [ stats["min"], (stats["min"]+stats["max"]) / 2.0, stats["max"] ],
            isGradient: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "Galactic Longitude [deg]" },
                    minValue: obsPerSrc["minL"],
                    maxValue: obsPerSrc["maxL"],
                    hasOffset: true
                },
                yAxis:
                {
                    caption: { text: "Galactic Latitude [deg]" },
                    minValue: obsPerSrc["minB"],
                    maxValue: obsPerSrc["maxB"],
                    hasOffset: true
                }
            },
            series:
            [
                {
                    type: "scatter",
                    scale: scale,
                    points:
                    {
                        data: [ { marker: { size: 10, elementType: "xyValue", data: obsPerSrc["path"] } } ]
                    }
                }
            ],
            scaleLegends:
            [
                {
                    scale: scale,
                    blockAlignment: "right",
                    contentAlignment: "left",
                    isContinuous: true
                }
            ]
        };
        const chart = new mdl.NChart("obsPerSrcScatter");
        chart.loadJSON(JSON.stringify(chartConfig));
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildStats(INPUT["Solution"]);
}
