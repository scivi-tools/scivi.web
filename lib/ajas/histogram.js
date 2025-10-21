
function pointHoveredCB(point, phase)
{
    if (point)
    {
        if (phase == "began")
            NChart3DLib.chart.highlightPoint(point.seriesIndex, point.pointIndex, 1.6, 0.1);
        else if (phase == "ended")
            NChart3DLib.chart.highlightPoint(point.seriesIndex, point.pointIndex, 1.0, 0.1);
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
}
