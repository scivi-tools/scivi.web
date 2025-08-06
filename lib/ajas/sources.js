
function plotHist(caption, data, thickness, canvas)
{
    NChart3DLib().then(mdl => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: caption },
                    valueMask: "%.3e"
                },
                yAxis:
                {
                    caption: { text: "Amount" },
                    valueMask: "%.0f"
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
        const chart = new mdl.NChart(canvas);
        chart.loadJSON(JSON.stringify(chartConfig));
    });
}

function plotMap(legendCaption, dataPath, minVal, maxVal, minL, maxL, minB, maxB, canvas, tooltip)
{
    NChart3DLib().then(mdl => {
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
            isGradient: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "Galactic Longitude [deg]" },
                    minValue: minL,
                    maxValue: maxL,
                    hasOffset: true
                },
                yAxis:
                {
                    caption: { text: "Galactic Latitude [deg]" },
                    minValue: minB,
                    maxValue: maxB,
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
                        data: [ { marker: { size: 5, elementType: "xyValue", data: dataPath } } ]
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
                    bloomFallOff: 4
                }
            },
            scaleLegends:
            [
                {
                    scale: scale,
                    blockAlignment: "right",
                    contentAlignment: "left",
                    isContinuous: true,
                    padding: [ 5, 5, 65, 5 ],
                    valueMask: "%.3e",
                    header:
                    {
                        textAlignment: "left",
                        text: legendCaption
                    }
                }
            ],
            maxZoom: 1000,
            hoverEnabled: true
        };

        NChart3DLib[canvas] = new mdl.NChart(canvas);
        NChart3DLib[canvas].pointHoveredCB = (point, phase) => {
            if (point === null || phase === "ended")
                tooltip.style.display = "none";
            else
            {
                tooltip.style.display = "inline";
                tooltip.innerHTML = `Source: ${point.index}<br/>Lon.: ${point.x.toFixed(3)}; Lat.: ${point.y.toFixed(3)}<br/>${legendCaption}: ${point.value.toExponential(3)}`;
            }
        };
        NChart3DLib[canvas].attachPointHoveredCallback(`NChart3DLib["${canvas}"].pointHoveredCB`);
        NChart3DLib[canvas].loadJSON(JSON.stringify(chartConfig));
    });
}

async function buildSources(solutionID)
{
    const stats = await get_src_stats(solutionID);
    const html = `
        <h2>Source Statistics</h2>
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
        <h3>Updates Histogram for 𝜐</h3>
        <div style="width: calc(100vw - 200px); height: 400px;">
            <canvas id="upsilonUpdatesHist" style="width: 100%; height: 100%;"></canvas>
        </div>
        <h3>Updates Histogram for 𝜌</h3>
        <div style="width: calc(100vw - 200px); height: 400px;">
            <canvas id="rhoUpdatesHist" style="width: 100%; height: 100%;"></canvas>
        </div>
        <h3>Updates Map for 𝜐</h3>
        <div style="width: calc(100vw - 200px); height: calc(100vh - 100px);">
            <canvas id="upsilonUpdatesMap" style="width: 100%; height: 100%;"></canvas>
        </div>
        <h3>Updates Map for 𝜌</h3>
        <div style="width: calc(100vw - 200px); height: calc(100vh - 100px);">
            <canvas id="rhoUpdatesMap" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.background = "#fefeff";
    tooltip.style.opacity = "0.9";
    tooltip.style.borderRadius = "5px";
    tooltip.style.border = "1px solid #333333";
    tooltip.style.padding = "8px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "10000";
    tooltip.style.display = "none";
    tooltip.id = "updatesMapTooltip";
    report.appendChild(tooltip);
    report.addEventListener("mousemove", function (e) {
        tooltip.style.left = e.clientX + "px";
        tooltip.style.top = (e.clientY + 20) + "px";
    });

    plotHist("Update in 𝜐 [μas]",
             stats["histUpsilon"], (stats["maxUpsilon"] - stats["minUpsilon"]) / 50.0,
             "upsilonUpdatesHist");
    plotHist("Update in 𝜌 [μas]",
             stats["histRho"], (stats["maxRho"] - stats["minRho"]) / 50.0,
             "rhoUpdatesHist");

    plotMap("Update in 𝜐 [μas]",
            stats["pathUpsilon"], stats["minUpsilon"], stats["maxUpsilon"],
            stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
            "upsilonUpdatesMap", tooltip);
    plotMap("Update in 𝜌 [μas]",
            stats["pathRho"], stats["minRho"], stats["maxRho"],
            stats["minL"], stats["maxL"], stats["minB"], stats["maxB"],
            "rhoUpdatesMap", tooltip);
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildSources(INPUT["Solution"]);
}
