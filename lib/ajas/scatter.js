/**
 * scatter.js
 *
 * Part of the ARI/ZAH Layered Online Reduction Inspection System (LORIS).
 *
 * @author Konstantin Riabinin (konstantin.riabinin@uni-heidelberg.de)
 *
 * This script is a client-side worker displaying scatter plots.
 */

/**
 * Fetch and display the observations for a given selected star.
 *
 * @param solutionID - solution ID.
 * @param point - selected point.
 * @param chart - chart the point belongs to.
 */
async function fetchObservations(solutionID, point, chart)
{
    const isJORS = SETTINGS_VAL["JORS"];
    const obsOfSrc = await get_observations_of_src(solutionID, point.z, isJORS);
    const chartConfig = {
        caption: { visible: false },
        cartesianSystem:
        {
            visible: true,
            xAxis:
            {
                caption: { text: isJORS ? "JORS 𝜐 [deg]" : "Galactic Longitude [deg]" },
                minValue: Math.min(obsOfSrc["minEta"], point.x),
                maxValue: Math.max(obsOfSrc["maxEta"], point.x),
                hasOffset: true,
                valueMask: "%.3e",
                minTickSpacing: 80
            },
            yAxis:
            {
                caption: { text: isJORS ? "JORS 𝜌 [deg]" : "Galactic Latitude [deg]" },
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
                name: `Source #${point.z}`,
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
        sizeAxis:
        {
            shouldIgnoreZoom: true
        },
        maxZoom: 1000,
        zoomToPointMode: true
    };
    chart.subChart().loadChartJSON(JSON.stringify(chartConfig));
}

/**
 * Display the observations for a given selected star.
 *
 * @param solutionID - solution ID.
 * @param point - selected point.
 * @param chart - chart the point belongs to.
 */
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
                    text: `Raccoons are washing\nthe source #${point.z} for you,\nplease wait...`
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

/**
 * Callback of chart point selection.
 *
 * @param point - selected point.
 */
function pointSelectedCB(point)
{
    displayObservations(SETTINGS_VAL["Solution"], point, NChart3DLib.chart);
}

/**
 * Callback of chart point hover.
 *
 * @param point - hovered point.
 * @param phase - hover phase.
 */
function pointHoveredCB(point, phase)
{
    const tooltip = document.getElementById("scatTooltip");
    if (point === null || phase === "ended")
        tooltip.style.display = "none";
    else
    {
        const cs = SETTINGS_VAL["Config"].cartesianSystem;
        tooltip.style.display = "inline";
        tooltip.innerHTML = `Source: ${point.z}<br/>${cs.xAxis.caption.text}: ${point.x.toFixed(3)}<br/>${cs.yAxis.caption.text}: ${point.y.toFixed(3)}<br/>Value: ${point.value.toExponential(3)}`;
    }
}

if (IN_VISUALIZATION)
{
    const html = `
        <div style="width: round(80%, 1px); height: round(calc(100vh - 50px), 1px); margin-left: 10%; margin-top: 25px; margin-bottom: 25px">
            <canvas id="chart" style="width: 100%; height: 100%;" oncontextmenu="return false;"></canvas>
        </div>
    `;

    const config = SETTINGS_VAL["Config"];
    ReportHelpers.enrichConfig(config);

    document.title = config.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    const subchartConfig = {
        size: [ 500, 400 ],
        borderThickness: 2,
        borderColor: "#000000",
        targetAreaOffset: [ 80, 80 ],
        visible: false
    };

    NChart3DLib().then(mdl => {
        NChart3DLib.chart = new mdl.NChart("chart");
        NChart3DLib.chart.pointHovered = pointHoveredCB;
        NChart3DLib.chart.pointSelected = pointSelectedCB;
        NChart3DLib.chart.subChart().loadConfigJSON(JSON.stringify(subchartConfig));
        NChart3DLib.chart.loadJSON(JSON.stringify(config));
    });

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
    tooltip.id = "scatTooltip";
    report.appendChild(tooltip);
    report.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.clientX + "px";
        tooltip.style.top = (e.clientY + 20) + "px";
    });
}
