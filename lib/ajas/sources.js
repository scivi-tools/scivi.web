
async function buildSources(solutionID)
{
    const stats = await get_src_stats(solutionID);
    const html = `
        <h2>Source Statistics</h2>
        <h3>Source Updates Properties [rad]</h3>
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
        <h3>Updates Histogram for 𝜐</h3>
        <div style="width: calc(100vw - 200px); height: 400px;">
            <canvas id="upsilonUpdatesHist" style="width: 100%; height: 100%;"></canvas>
        </div>
        <h3>Updates Histogram for 𝜌</h3>
        <div style="width: calc(100vw - 200px); height: 400px;">
            <canvas id="rhoUpdatesHist" style="width: 100%; height: 100%;"></canvas>
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
                xAxis:
                {
                    caption: { text: "Update in 𝜐 [rad]" },
                    valueMask: "%.3e"
                },
                yAxis:
                {
                    caption: { text: "Amount" },
                    valueMask: "%d"
                }
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
                        data: stats["histUpsilon"]
                    }
                }
            ],
            seriesSettings:
            {
                column:
                {
                    thickness: (stats["maxUpsilon"] - stats["minUpsilon"]) / 50.0
                }
            }
        };
        const chart = new mdl.NChart("upsilonUpdatesHist");
        chart.loadJSON(JSON.stringify(chartConfig));
    });

    NChart3DLib().then(mdl => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "Update in 𝜌 [rad]" },
                    valueMask: "%.3e"
                },
                yAxis:
                {
                    caption: { text: "Amount" },
                    valueMask: "%d"
                }
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
                        data: stats["histRho"]
                    }
                }
            ],
            seriesSettings:
            {
                column:
                {
                    thickness: (stats["maxRho"] - stats["minRho"]) / 50.0
                }
            }
        };
        const chart = new mdl.NChart("rhoUpdatesHist");
        chart.loadJSON(JSON.stringify(chartConfig));
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildSources(INPUT["Solution"]);
}
