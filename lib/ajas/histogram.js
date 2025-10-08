
if (IN_VISUALIZATION)
{
    const html = `
        <div style="width: 80%; height: calc(100vh - 50px); margin-left: 10%; margin-top: 25px; margin-bottom: 25px">
            <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    document.title = SETTINGS_VAL["Config"].caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    NChart3DLib().then(mdl => {
        NChart3DLib.chart = new mdl.NChart("chart");
        NChart3DLib.chart.loadJSON(JSON.stringify(SETTINGS_VAL["Config"]));
    });
}
