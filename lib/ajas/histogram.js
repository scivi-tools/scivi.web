
function pointHoveredCB(point, phase)
{
    const tooltip = document.getElementById("histTooltip");
    if (point)
    {
        switch (phase)
        {
        case "began":
            NChart3DLib.chart.highlightPoint(point.seriesIndex, point.pointIndex, 1.6, 0.1);
            tooltip.style.display = "inline";
            // no break intentianally.

        case "changed":
            tooltip.innerHTML = `x: ${point.x.toExponential(3)}<br/>y: ${point.y}`;
            break;

        case "ended":
            NChart3DLib.chart.highlightPoint(point.seriesIndex, point.pointIndex, 1.0, 0.1);
            tooltip.style.display = "none";
            break;
        }
    }
    else
    {
        tooltip.style.display = "none";
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
    tooltip.id = "histTooltip";
    report.appendChild(tooltip);
    report.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.clientX + "px";
        tooltip.style.top = (e.clientY + 20) + "px";
    });
}
