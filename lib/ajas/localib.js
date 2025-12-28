
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

function makeLODs(seriesType, color, lods, addLODNames)
{
    const chartLODs = [];
    for (let i = 0, n = lods.length; i < n; ++i)
    {
        const series = {};
        let pointType;
        if (seriesType == "line")
        {
            series.type = "line";
            series.brush = color;
            series.lineThickness = 3;
            pointType = "xy";
        }
        else if (i == n - 1)
        {
            series.type = "column";
            series.brush = color;
            series.borderThickness = 1.0;
            series.borderBrush = "#0000BB";
            pointType = "xy";
        }
        else
        {
            series.type = "band";
            series.borderThickness = 0;
            series.positiveColor = color;
            pointType = "xLowHigh";
        }
        if (addLODNames)
            series.name = lods[i].name;
        chartLODs.push({
            zoom: lods[i].zoom,
            data: lods[i].data,
            elementType: pointType,
            series: series
        });
    }
    return {
        type: "lod",
        lods: chartLODs,
        legendMarkerSize: 0
    };
}

async function plot(caption, valuesLODs, fitLODs, residualsLODs, valuesColor, cvsID, tsURL)
{
    const chartConfig = {
        cartesianSystem:
        {
            xAxis:
            {
                caption: { visible: true, font: { size: 13 }, text: "Mission time" },
                hasOffset: false,
                font: { size: 13 },
                shouldBeautifyMinAndMax: false,
                minValue: 0,
                maxValue: valuesLODs[valuesLODs.length - 1].data.length - 1,
                doubleToString: "NChart3DLib.ts2s"
            },
            yAxis:
            {
                valueMask: "%.0e",
                caption: { visible: true, font: { size: 13 }, text: "Parameter Value, [μas]" },
                font: { size: 13 }
            },
            syAxis:
            {
                valueMask: "%.0e",
                caption: { visible: true, font: { size: 13 }, text: "Residual, [μas]" },
                font: { size: 13 }
            },
            margin: [ 0, 0, 0, 0 ]
        },
        caption: { visible: false },
        shouldAntialias: true,
        adaptiveAntialiasing: false,
        series:
        [
            {
                type: "band",
                positiveColor: valuesColor,
                borderThickness: 0,
                points:
                {
                    type: "xLowHigh",
                    data: valuesLODs[0].data
                }
            },
            {
                type: "band",
                hostsOnSY: true,
                positiveColor: "#004D8088",
                borderThickness: 0,
                points:
                {
                    type: "xLowHigh",
                    data: residualsLODs[0].data
                }
            },
            {
                type: "line",
                brush: "#B51700",
                lineThickness: 3,
                points:
                {
                    type: "xy",
                    data: fitLODs[0].data
                }
            }
        ]
    };
    await ReportHelpers.createChart((chart) => {
        NChart3DLib.ts2s = ts2s;
        chart[cvsID] = () => {
            // chartConfigValues.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            // chartConfigValues.caption = { visible: true, text: caption };
            // chartConfigValues.series[0] = makeLODs("band", valuesColor, valuesLODs, false);
            // chartConfigValues.series[1] = makeLODs("line", "#B51700", fitLODs, false);

            // chartConfigResiduals.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            // chartConfigResiduals.series[0] = makeLODs("band", "#004D80", residualsLODs, true);

            // SCIVI.forkWithTemplate(ReportHelpers.loCalibMonTemplate(chartConfigValues,
            //                                                         chartConfigResiduals,
            //                                                         tsURL,
            //                                                         INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, cvsID);
    });
}

async function loadTimestamps(url)
{
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Float64Array(buffer);
}

function canvasID(paramName, detectorName, coord)
{
    return `lo_calib_param_${paramName}_${detectorName}_${coord}`;
}

function cmos(n, param, coord)
{
    const detector = param.detectors[n];
    const width = ReportHelpers.calcChartWidth(4, 0, 50);
    const cvsID = canvasID(param.name, detector.name, coord);
    return `
        <h3>${detector.name}</h3>
        <div class="report-detector-dashrow">
            <div onclick="NChart3DLib.chart.${cvsID}();">
                <canvas id="${cvsID}" style="width: ${width}px; height: 200px;"></canvas>
            </div>
        </div>
    `;
}

function buildParam(param, legend)
{
    return `
        <div id="lo_calib_param_${param.name}">
            <div class="report-dashrow">
                <div class="report-detector-dashbox">
                    <h3>Calibration Parameters Δ𝜂<sub>${param.name}</sub></h3>
                    <div class="report-detector-outer-dashrow">
                        <div class="report-detector-dashbox">
                            ${cmos(0, param, "eta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(1, param, "eta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(2, param, "eta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(3, param, "eta")}
                        </div>
                    </div>
                </div>
                <div class="report-detector-dashbox">
                    <h3>Calibration Parameters Δ𝜁<sub>${param.name}</sub></h3>
                    <div class="report-detector-outer-dashrow">
                        <div class="report-detector-dashbox">
                            ${cmos(0, param, "zeta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(1, param, "zeta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(2, param, "zeta")}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(3, param, "zeta")}
                        </div>
                    </div>
                </div>
            </div>
            ${legend}
        </div>
    `;
}

function selectParam(params, paramName)
{
    for (let i = 0; i < params.length; ++i)
        document.getElementById(`lo_calib_param_${params[i].name}`).style.display = paramName === params[i].name ? "" : "none";
}

async function buildLOCalib(solutionID)
{
    const stats = await get_lo_calib_stats(solutionID);
    CACHE["timestamps"] = await loadTimestamps(stats.timestamps);

    const legend = `
        <div class="report-dashrow" style="justify-content: center; align-items: center; column-gap: 10px; margin-bottom: 20px; margin-top: 10px;">
            <div class="report-legend-square" style="background-color: #FF7F7F"></div>
            <div class="report-legend-square" style="background-color: #60CCE8"></div>
            <div style="margin-right: 20px;">Calibration Parameter</div>
            <div class="report-legend-square" style="background-color: #B51700"></div>
            <div>Fit of y = ax + b + c sin(dx + e)</div>
            <div class="report-legend-square" style="background-color: #004D80"></div>
            <div style="margin-right: 20px;">Residuals to that function</div>
        </div>
    `;

    let html = `
        <h2>Lower Order Calibration Monitor</h2>
        <div class="report-dimensions">
            <div class="report-dimensions-row">
                <div class="report-dimensions-col">
                    <h3>Parameter:</h3>
                </div>
                <div class="report-dimensions-col">
                    <div class="report-subsets-slider"
                         style="width: ${Math.min((stats.params.length - 1) * 100, 700)}px"
                         id="lo_calib_params"/>
                    </div>
                </div>
            </div>
        </div>
    `;

    for (let p = 0, pCnt = stats.params.length; p < pCnt; ++p)
        html += buildParam(stats.params[p], legend);

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_TAB(report, "LO Calibration");

    const slider = document.getElementById("lo_calib_params");
    const format = {
        from: (value) => { return stats.params[value].name; },
        to: (value) => { return stats.params[Math.round(value)].name; }
    };
    noUiSlider.create(slider, {
        start: [ 0 ],
        range:
        {
            min: 0,
            max: stats.params.length - 1
        },
        step: 1,
        behaviour: "smooth-steps-tap",
        format: format,
        pips:
        {
            mode: "steps",
            format: format,
            density: 100 / (stats.params.length - 1)
        },
        tooltips: true
    });
    slider.noUiSlider.on("update", (values, handle) => {
        selectParam(stats.params, values[0]);
    });

    for (let p = 0, pCnt = stats.params.length; p < pCnt; ++p)
    {
        for (let n = 0; n < 4; ++n)
        {
            await plot(`Calibration Parameters Δ𝜂${stats.params[p].name} of ${stats.params[p].detectors[n].name}`,
                       stats.params[p].detectors[n].etaValues,
                       stats.params[p].detectors[n].etaFit,
                       stats.params[p].detectors[n].etaResiduals,
                       n == 0 || n == 3 ? "#FF7F7F" : "#60CCE8",
                       canvasID(stats.params[p].name, stats.params[p].detectors[n].name, "eta"),
                       stats.timestamps);
            await plot(`Calibration Parameters Δ𝜁${stats.params[p].name} of ${stats.params[p].detectors[n].name}`,
                       stats.params[p].detectors[n].zetaValues,
                       stats.params[p].detectors[n].zetaFit,
                       stats.params[p].detectors[n].zetaResiduals,
                       n == 0 || n == 3 ? "#60CCE8" : "#FF7F7F",
                       canvasID(stats.params[p].name, stats.params[p].detectors[n].name, "zeta"),
                       stats.timestamps);
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildLOCalib(INPUT["Solution"]);
}
