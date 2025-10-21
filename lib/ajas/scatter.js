
function pointHoveredCB(point, phase)
{
    const tooltip = document.getElementById("scatTooltip");
    if (point === null || phase === "ended")
        tooltip.style.display = "none";
    else
    {
        tooltip.style.display = "inline";
        tooltip.innerHTML = `Source: ${point.pointIndex}<br/>x: ${point.x.toFixed(3)}<br/>y: ${point.y.toFixed(3)}<br/>value: ${point.value.toExponential(3)}`;
    }
}

if (IN_VISUALIZATION)
{
    const html = `
        <div style="width: round(80%, 1px); height: round(calc(100vh - 50px), 1px); margin-left: 10%; margin-top: 25px; margin-bottom: 25px">
            <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    const config = SETTINGS_VAL["Config"];
    ReportHelpers.enrichConfig(config);

    document.title = config.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    NChart3DLib().then(mdl => {
        NChart3DLib.chart = new mdl.NChart("chart");
        NChart3DLib.chart.pointHovered = pointHoveredCB;
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
