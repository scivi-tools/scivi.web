
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

function linkMouseEvent(cvsID1, cvsID2, type)
{
    document.getElementById(cvsID1).addEventListener(type, (event) => {
        if (!CACHE["inEvent"])
        {
            const cvs1 = document.getElementById(cvsID1);
            const cvs2 = document.getElementById(cvsID2);
            const pRect1 = NChart3DLib[cvsID1].plotAreaRect;
            const pRect2 = NChart3DLib[cvsID2].plotAreaRect;
            const y1 = cvs1.getBoundingClientRect().top + (cvs1.clientHeight - (pRect1.y + pRect1.height));
            const y2 = cvs2.getBoundingClientRect().top + (cvs2.clientHeight - (pRect2.y + pRect2.height));
            const yRatio = (event.clientY - y1) / pRect1.height;
            const yE = yRatio * pRect2.height + y2;
            const evt = new MouseEvent(type, {
                button: event.button,
                clientX: event.clientX,
                clientY: yRatio < 0.5 ? Math.ceil(yE) : Math.floor(yE)
            });
            CACHE["inEvent"] = true;
            cvs2.dispatchEvent(evt);
            CACHE["inEvent"] = false;
        }
    });
}

function linkWheelEvent(cvsID1, cvsID2)
{
    document.getElementById(cvsID1).addEventListener("wheel", (event) => {
        if (!CACHE["inEvent"])
        {
            const evt = new WheelEvent("wheel", {
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                deltaZ: event.deltaZ,
                deltaMode: event.deltaMode,
            });
            CACHE["inEvent"] = true;
            document.getElementById(cvsID2).dispatchEvent(evt);
            CACHE["inEvent"] = false;
        }
    });
}

function linkEvents(cvsID1, cvsID2)
{
    linkMouseEvent(cvsID1, cvsID2, "mousedown");
    linkMouseEvent(cvsID1, cvsID2, "mouseup");
    linkMouseEvent(cvsID1, cvsID2, "mousemove");
    linkMouseEvent(cvsID1, cvsID2, "mouseleave");
    linkWheelEvent(cvsID1, cvsID2);
}

if (IN_VISUALIZATION)
{
    const valChartConfig = SETTINGS_VAL["ValConfig"];
    const resChartConfig = SETTINGS_VAL["ResConfig"];
    const tsURL = SETTINGS_VAL["TSURL"];

    // HINT: Initially, the top and bottom margin was 25 px, so it was round(calc(70vh - 25px) and round(calc(30vh - 25px)
    // However with the legend, the bottom 20 pixels are used for it, and for symmetry, the top margin is now 25-20=5,
    // and also in calcs there is not (25+25)/2 = 25, but (20+5+5)/2 = 15.
    // This should be cleaned up when the calib monitor is settled down.
    // By cleaning up I mean the UNIFICATION with other views: histogram, scatter, and heatmap.
    // Also, I positively don't like the color query like valChartConfig.series[0].lods[0].series.positiveColor
    // It should be a dedicated setting for the legend colors and names, not crutches like this!
    const html = `
        <div style="width: round(80%, 1px); height: round(calc(70vh - 15px), 1px); margin-left: 10%; margin-top: 5px;">
            <canvas id="valChart" style="width: 100%; height: 100%;" oncontextmenu="return false;"></canvas>
        </div>
        <div style="width: round(80%, 1px); height: round(calc(30vh - 15px), 1px); margin-left: 10%;">
            <canvas id="resChart" style="width: 100%; height: 100%;" oncontextmenu="return false;"></canvas>
        </div>
        <div style="display: flex; flex-flow: row wrap; row-gap: 10px; font-family: Helvetica; justify-content: center; align-items: center; column-gap: 10px;">
            <div class="report-legend-square" style="background-color: ${valChartConfig.series[0].lods[0].series.positiveColor}"></div>
            <div>Calibration Parameter</div>
            <div class="report-legend-square" style="background-color: #B51700"></div>
            <div>Fit of y = ax + b + c sin(dx + e)</div>
            <div class="report-legend-square" style="background-color: #004D80"></div>
            <div>Residuals to that function</div>
        </div>
    `;

    enrich(valChartConfig);
    enrich(resChartConfig);

    document.title = valChartConfig.caption.text;

    const report = document.createElement("div");
    report.innerHTML = html;
    ADD_VISUAL(report);

    CACHE["timestamps"] = await loadTimestamps(tsURL);

    CACHE["inEvent"] = false;
    linkEvents("valChart", "resChart");
    linkEvents("resChart", "valChart");

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
