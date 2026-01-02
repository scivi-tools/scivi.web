
function ts2s(x)
{
    const ts = Math.round(x);
    const tsArr = CACHE["timestamps"];
    if (ts < 0 || ts >= tsArr.length)
        return "";
    const date = new Date(tsArr[ts] * 1000);
    const dd = String(date.getDate()).padStart(2, "0");
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).substring(2);
    return `${dd}.${mo}.${yy}`;
}

async function loadTimestamps(url)
{
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Float64Array(buffer);
}

function enrich(config)
{
    config.seriesSettings = { column: { thickness: 0.5 } };
    config.zoomMode = "directional";
    config.userInteractionMode = [ "horizontalMove", "horizontalZoom" ];
    config.maxZoom = 1000.0;
    config.zoomToPointMode = true;
}

function makeLegend(config)
{
    let result = "";
    for (let i = 0, n = config.series.length; i < n; ++i)
    {
        result += `<div id="legendEntry${i}" class="report-legend-block">
            <div class="report-legend-square" style="background-color: ${config.series[i].lColor}"></div>
            <div>${config.series[i].lName}</div>
        </div>`;
    }
    return result;
}

function attachLegendClicks(config)
{
    for (let i = 0, n = config.series.length; i < n; ++i)
    {
        const entry = document.getElementById(`legendEntry${i}`);
        entry.addEventListener("click", (e) => {
            NChart3DLib.chart.toggleSeries(i);
            if (entry.seriesVisible === undefined)
                entry.seriesVisible = true;
            entry.seriesVisible = !entry.seriesVisible;
            entry.style.opacity = entry.seriesVisible ? 1.0 : 0.5;
        });
    }
}

if (IN_VISUALIZATION)
{
    const chartConfig = SETTINGS_VAL["Config"];
    const tsURL = SETTINGS_VAL["TSURL"];

    const html = `
        <div style="width: round(80%, 1px); height: round(calc(100vh - 70px), 1px); margin-left: 10%; margin-top: 25px; margin-bottom: 5px">
            <canvas id="chart" style="width: 100%; height: 100%;" oncontextmenu="return false;"></canvas>
        </div>
        <div class="report-legend-block" style="user-select: none;">
            ${makeLegend(chartConfig)}
        </div>
    `;

    enrich(chartConfig);

    document.title = chartConfig.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    attachLegendClicks(chartConfig);

    CACHE["timestamps"] = await loadTimestamps(tsURL);

    NChart3DLib().then(mdl => {
        NChart3DLib.ts2s = ts2s;
        NChart3DLib.chart = new mdl.NChart("chart");
        NChart3DLib.chart.loadJSON(JSON.stringify(chartConfig));
    });
}
