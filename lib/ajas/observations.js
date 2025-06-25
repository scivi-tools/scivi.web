
async function displayObservations(solutionID, point, chart)
{
    if (point)
    {
        const obsOfSrc = await get_observations_of_src(solutionID, point.index);
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "FoVRS Eta [rad]" },
                    minValue: obsOfSrc["minEta"],
                    maxValue: obsOfSrc["maxEta"],
                    hasOffset: true,
                    valueMask: "%.3e",
                    minTickSpacing: 80
                },
                yAxis:
                {
                    caption: { text: "FoVRS Zeta [rad]" },
                    minValue: obsOfSrc["minZeta"],
                    maxValue: obsOfSrc["maxZeta"],
                    hasOffset: true,
                    valueMask: "%.3e"
                }
            },
            series:
            [
                {
                    type: "scatter",
                    brush: "#ff0000",
                    name: "Observations",
                    points:
                    {
                        data: [ { marker: { size: 5, elementType: "xy", data: obsOfSrc["path"] } } ]
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
            legend:
            {
                visible: true,
                padding: [ 10, 10, 10, 0 ]
            },
            maxZoom: 1000
        };
        chart.subChart().loadChartJSON(JSON.stringify(chartConfig));
        chart.subChart().setTarget(point.x, point.y, 0.0);
        chart.subChart().setVisibleAnimated(true, 0.25);
    }
    else
    {
        chart.subChart().setVisibleAnimated(false, 0.25);
    }
}

function pointSelectedCB(point)
{
    displayObservations(INPUT["Solution"], point, NChart3DLib.obsPerSrcScatter);
}

function pointHoveredCB(point, phase)
{
    const tooltip = document.getElementById("obsPerSrcScatterTooltip");
    if (point === null || phase === "ended")
        tooltip.style.display = "none";
    else
    {
        tooltip.style.display = "inline";
        tooltip.innerHTML = `Source: ${point.index}<br/>Lon.: ${point.x.toFixed(3)}; Lat.: ${point.y.toFixed(3)}<br/>Obs. Num.: ${point.value}`;
    }
}

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
        <h3>Observations per source distribution</h3>
        <div style="width: calc(100vw - 200px); height: 400px;">
            <canvas id="obsPerSrcHist" style="width: 100%; height: 100%;"></canvas>
        </div>
        <h3>Observations per source map</h3>
        <div style="width: calc(100vw - 200px); height: 600px;">
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
                xAxis:
                {
                    caption: { text: "Observations / Source" },
                    valueMask: "%.0f"
                },
                yAxis:
                {
                    caption: { text: "Log(Amount)" },
                    isLogarithmic: true,
                    valueMask: "%.1e"
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
            brushes: [ "#E40303", "#FF8C00", "#FFED00", "#00CF3D", "#0072FF", "#000000" ],
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
                        data: [ { marker: { size: 5, elementType: "xyValue", data: obsPerSrc["path"] } } ]
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
                    header:
                    {
                        textAlignment: "left",
                        text: "Obs. Num."
                    }
                }
            ],
            maxZoom: 1000,
            hoverEnabled: true
        };
        const subchartConfig = {
            size: [ 500, 400 ],
            borderThickness: 2,
            borderColor: "#000000",
            visible: false
        };
        NChart3DLib.obsPerSrcScatter = new mdl.NChart("obsPerSrcScatter");
        NChart3DLib.pointSelectedCB = pointSelectedCB;
        NChart3DLib.pointHoveredCB = pointHoveredCB;
        NChart3DLib.obsPerSrcScatter.attachPointSelectedCallback("NChart3DLib.pointSelectedCB");
        NChart3DLib.obsPerSrcScatter.attachPointHoveredCallback("NChart3DLib.pointHoveredCB");
        NChart3DLib.obsPerSrcScatter.subChart().loadConfigJSON(JSON.stringify(subchartConfig));
        NChart3DLib.obsPerSrcScatter.loadJSON(JSON.stringify(chartConfig));

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
        tooltip.id = "obsPerSrcScatterTooltip";
        report.appendChild(tooltip);
        report.addEventListener("mousemove", function (e) {
            tooltip.style.left = e.clientX + "px";
            tooltip.style.top = (e.clientY + 20) + "px";
        });
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildStats(INPUT["Solution"]);
}
