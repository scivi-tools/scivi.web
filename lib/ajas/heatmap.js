
if (IN_VISUALIZATION)
{
    const html = `
        <div class="report-chart-controls">
            <div class="report-chart-controls-leftpanel">
                <div class="report-chart-controls-item">
                    <label class="report-switch">
                        <input id="heatmapLog" type="checkbox">
                        <span class="report-switch-slider round"></span>
                    </label>
                    <span>Logarithmic coloring</span>
                </div>
                <div class="report-chart-controls-item">
                    <label class="report-switch">
                        <input id="heatmap3D" type="checkbox">
                        <span class="report-switch-slider round"></span>
                    </label>
                    <span>3D view</span>
                </div>
            </div>
            <div style="width: round(80%, 1px); height: 100%;">
                <canvas id="chart" style="width: 100%; height: 100%;" oncontextmenu="return false;"></canvas>
            </div>
        </div>
    `;

    const config = SETTINGS_VAL["Config"];
    // ReportHelpers.enrichConfig(config);

    document.title = config.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    const heatmapLog = document.getElementById("heatmapLog");
    heatmapLog.onclick = () => {
        config.series[0].scale.isLogarithmic = config.scaleLegends[0].scale.isLogarithmic = heatmapLog.checked;
        NChart3DLib.chart.loadJSON(JSON.stringify(config));
    };

    const heatmap3D = document.getElementById("heatmap3D");
    heatmap3D.onclick = () => {
        if (heatmap3D.checked)
        {
            config.series[0].type = "surface";
            config.series[0].points.type = "xzy";
            config.drawIn3D = true;
            config.shouldAntialias = true;
        }
        else
        {
            config.series[0].type = "heatmap";
            config.series[0].points.type = "xyValue";
            config.drawIn3D = false;
            config.shouldAntialias = false;
        }
        NChart3DLib.chart.loadJSON(JSON.stringify(config));
    };

    NChart3DLib().then(mdl => {
        NChart3DLib.chart = new mdl.NChart("chart");
        NChart3DLib.chart.loadJSON(JSON.stringify(config));
    });
}
