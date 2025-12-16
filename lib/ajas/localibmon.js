
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
}

function linkMouseEvent(cvs1, cvs2, type)
{
    cvs1.addEventListener(type, (event) => {
        if (!CACHE["inEvent"])
        {
            CACHE["inEvent"] = true;
            const y1 = cvs1.getBoundingClientRect().top;
            const y2 = cvs2.getBoundingClientRect().top;
            const evt = new MouseEvent(type, {
                button: event.button,
                clientX: event.clientX,
                clientY: y2 + (event.clientY - y1) / cvs1.clientHeight * cvs2.clientHeight
            });
            cvs2.dispatchEvent(evt);
            CACHE["inEvent"] = false;
        }
    });
}

function linkWheelEvent(cvs1, cvs2)
{
    cvs1.addEventListener("wheel", (event) => {
        if (!CACHE["inEvent"])
        {
            CACHE["inEvent"] = true;
            const evt = new WheelEvent("wheel", {
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                deltaZ: event.deltaZ,
                deltaMode: event.deltaMode,
            });
            cvs2.dispatchEvent(evt);
            CACHE["inEvent"] = false;
        }
    });
}

function linkEvents(cvs1, cvs2)
{
    linkMouseEvent(cvs1, cvs2, "mousedown");
    linkMouseEvent(cvs1, cvs2, "mouseup");
    linkMouseEvent(cvs1, cvs2, "mousemove");
    linkMouseEvent(cvs1, cvs2, "mouseleave");
    linkWheelEvent(cvs1, cvs2);
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

    enrich(valChartConfig);
    enrich(resChartConfig);

    document.title = valChartConfig.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    CACHE["timestamps"] = await loadTimestamps(tsURL);

    const valCanvas = document.getElementById("valChart");
    const resCanvas = document.getElementById("resChart");
    CACHE["inEvent"] = false;
    linkEvents(valCanvas, resCanvas);
    linkEvents(resCanvas, valCanvas);

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
