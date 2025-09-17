
async function fetchObservations(solutionID, point, chart)
{
    const obsOfSrc = await get_observations_of_src(solutionID, point.index);
    const chartConfig = {
        caption: { visible: false },
        cartesianSystem:
        {
            visible: true,
            xAxis:
            {
                caption: { text: "Galactic Longitude [deg]" },
                minValue: Math.min(obsOfSrc["minEta"], point.x),
                maxValue: Math.max(obsOfSrc["maxEta"], point.x),
                hasOffset: true,
                valueMask: "%.3e",
                minTickSpacing: 80
            },
            yAxis:
            {
                caption: { text: "Galactic Latitude [deg]" },
                minValue: Math.min(obsOfSrc["minZeta"], point.y),
                maxValue: Math.max(obsOfSrc["maxZeta"], point.y),
                hasOffset: true,
                valueMask: "%.3e"
            },
            sameResolution: true
        },
        series:
        [
            {
                type: "scatter",
                brush: "#F27200",
                name: "Observations",
                points:
                {
                    data: [ { marker: { size: 5, elementType: "xy", data: obsOfSrc["path"] } } ]
                }
            },
            {
                type: "bubble",
                name: `Source #${point.index}`,
                marker:
                {
                    shape: "circle",
                    brush: "#0076BA",
                    size: 10
                },
                points:
                {
                    data: [ { x: point.x, y: point.y } ]
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
}

async function displayObservations(solutionID, point, chart)
{
    if (point)
    {
        if (chart.subChart().visible())
        {
            chart.subChart().setVisibleAnimated(false, 0.25);
            setTimeout(displayObservations, 300, solutionID, point, chart);
        }
        else
        {
            const chartConfig = {
                caption:
                {
                    visible: true,
                    padding: [ 0, 0, 0, 100 ],
                    font: { size: 30 },
                    text: `Raccoons are washing\nthe source #${point.index} for you,\nplease wait...`
                },
                cartesianSystem: { visible: false }
            };
            chart.subChart().loadChartJSON(JSON.stringify(chartConfig));
            chart.subChart().setTarget(point.x, point.y, 0.0);
            chart.subChart().setVisibleAnimated(true, 0.25);

            fetchObservations(solutionID, point, chart);
        }
    }
    else
    {
        chart.subChart().setVisibleAnimated(false, 0.25);
    }
}

function pointSelectedCB(point)
{
    displayObservations(INPUT["Solution"], point, NChart3DLib.uncertaintiesScatter);
}

function pointHoveredCB(point, phase)
{
    const tooltip = document.getElementById("uncertaintiesScatterTooltip");
    if (point === null || phase === "ended")
        tooltip.style.display = "none";
    else
    {
        tooltip.style.display = "inline";
        tooltip.innerHTML = `Source: ${point.index}<br/>Lon.: ${point.x.toFixed(3)}; Lat.: ${point.y.toFixed(3)}<br/>Uncertainty: ${point.value.toExponential(3)}`;
    }
}

async function buildUncertainties(solutionID)
{
    const uns = await get_src_uncertainties(solutionID);
    const html = `
        <h2>Solution Uncertainties</h2>
        <div style="width: calc(100vw - 200px); height: calc(100vh - 100px);">
            <canvas id="uncertaintiesScatter" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    NChart3DLib().then(mdl => {
        const scale = {
            brushes: [ "#0072FF", "#00CF3D", "#FFD000", "#FF8C00", "#E40303", "#000000" ],
            values:
            [
                uns["minU"],
                uns["minU"] + Math.pow(500.0, 0.25) / 500.0 * (uns["maxU"] - uns["minU"]),
                uns["minU"] + Math.pow(500.0, 0.5) / 500.0 * (uns["maxU"] - uns["minU"]),
                uns["minU"] + Math.pow(500.0, 0.75) / 500.0 * (uns["maxU"] - uns["minU"]),
                uns["maxU"]
            ],
            isGradient: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: "Galactic Longitude [deg]" },
                    minValue: uns["minL"],
                    maxValue: uns["maxL"],
                    hasOffset: true
                },
                yAxis:
                {
                    caption: { text: "Galactic Latitude [deg]" },
                    minValue: uns["minB"],
                    maxValue: uns["maxB"],
                    hasOffset: true
                },
                sameResolution: true
            },
            series:
            [
                {
                    type: "scatter",
                    scale: scale,
                    points:
                    {
                        data: [ { marker: { size: 5, elementType: "xyValue", data: uns["path"] } } ]
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
                    blockAlignment: "right",
                    contentAlignment: "left",
                    isContinuous: true,
                    padding: [ 5, 5, 65, 5 ],
                    valueMask: "%.3e",
                    header:
                    {
                        textAlignment: "left",
                        text: "Uncertainty [rad]"
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
            targetAreaOffset: [ 80, 80 ],
            visible: false
        };
        NChart3DLib.uncertaintiesScatter = new mdl.NChart("uncertaintiesScatter");
        NChart3DLib.uncertaintiesScatter.pointSelectedCB = pointSelectedCB;
        NChart3DLib.uncertaintiesScatter.pointHoveredCB = pointHoveredCB;
        NChart3DLib.uncertaintiesScatter.attachPointSelectedCallback("NChart3DLib.uncertaintiesScatter.pointSelectedCB");
        NChart3DLib.uncertaintiesScatter.attachPointHoveredCallback("NChart3DLib.uncertaintiesScatter.pointHoveredCB");
        NChart3DLib.uncertaintiesScatter.subChart().loadConfigJSON(JSON.stringify(subchartConfig));
        NChart3DLib.uncertaintiesScatter.loadJSON(JSON.stringify(chartConfig));

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
        tooltip.id = "uncertaintiesScatterTooltip";
        report.appendChild(tooltip);
        report.addEventListener("mousemove", function (e) {
            tooltip.style.left = e.clientX + "px";
            tooltip.style.top = (e.clientY + 20) + "px";
        });
    });
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildUncertainties(INPUT["Solution"]);
}
