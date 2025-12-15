
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

if (IN_VISUALIZATION)
{
    const html = `
        <div style="width: round(80%, 1px); height: round(calc(70vh - 25px), 1px); margin-left: 10%; margin-top: 25px;">
            <canvas id="valChart" style="width: 100%; height: 100%;"></canvas>
        </div>
        <div style="width: round(80%, 1px); height: round(calc(30vh - 25px), 1px); margin-left: 10%; margin-bottom: 25px">
            <canvas id="resChart" style="width: 100%; height: 100%;"></canvas>
        </div>
    `;

    const valChartConfig = SETTINGS_VAL["ValConfig"];
    const resChartConfig = SETTINGS_VAL["ResConfig"];
    const tsURL = SETTINGS_VAL["TSURL"];

    document.title = valChartConfig.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    CACHE["timestamps"] = await loadTimestamps(tsURL);

    NChart3DLib().then(mdl => {
        NChart3DLib.ts2s = ts2s;
        NChart3DLib.valChart = new mdl.NChart("valChart");
        NChart3DLib.valChart.loadJSON(JSON.stringify(valChartConfig));
    });

    NChart3DLib().then(mdl => {
        NChart3DLib.resChart = new mdl.NChart("resChart");
        NChart3DLib.resChart.loadJSON(JSON.stringify(resChartConfig));
    });
}
