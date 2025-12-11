
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

async function plotValues(values, fit, color, cvsIDBase)
{
    await ReportHelpers.createChart((chart) => {
        NChart3DLib.ts2s = ts2s;
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { visible: false },
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false,
                    labelsVisible: false
                    // doubleToString: "NChart3DLib.ts2s"
                },
                yAxis:
                {
                    valueMask: "%.2e",
                    caption: { text: "Parameter Value, [μas]" }
                },
                margin: [ 0, 0, 0, 0 ],
                plotAreaMargin: [ 75, 50, 10, 5 ]
            },
            caption: { visible: false },
            shouldAntialias: true,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "area",
                    brush: color,
                    borderThickness: 0,
                    points:
                    {
                        type: "xy",
                        data: values
                    }
                },
                {
                    type: "line",
                    brush: "#B51700",
                    lineThickness: 3,
                    points:
                    {
                        type: "xy",
                        data: fit
                    }
                }
            ],
        };
        // chart[canvas] = () => {
        //     chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
        //     chartConfig.caption = { visible: true, text: caption + " of " + detector };
        //     delete chartConfig.cartesianSystem.yAxis.doubleToString;
        //     chartConfig.cartesianSystem.yAxis.caption = "Amount";
        //     chartConfig.cartesianSystem.yAxis.valueMask = "%.1e";
        //     chartConfig.series[0].name = "Residuals";
        //     chartConfig.series[0].type = "column";
        //     chartConfig.series[0].borderThickness = 1.0;
        //     chartConfig.series[0].borderBrush = "#000000";
        //     chartConfig.series[1].name = "Gaussian";
        //     if (gaussS1)
        //         chartConfig.series[2].name = "Gaussian (σ = 1)";
        //     SCIVI.forkWithTemplate(ReportHelpers.histogramTemplate(chartConfig, INPUT["Solution"]));
        // };
        ReportHelpers.renderChart(chart, chartConfig, cvsIDBase + "_val");
    });
}

async function plotResiduals(residuals, cvsIDBase)
{
    await ReportHelpers.createChart((chart) => {
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { visible: true, text: "Mission time" },
                    hasOffset: false,
                    shouldBeautifyMinAndMax: false,
                    doubleToString: "NChart3DLib.ts2s"
                },
                yAxis:
                {
                    valueMask: "%.2e",
                    caption: { text: "Residual, [μas]" }
                },
                margin: [ 0, 0, 0, 0 ],
                plotAreaMargin: [ 75, 50, 60, 10 ]
            },
            caption: { visible: false },
            shouldAntialias: true,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "area",
                    brush: "#004D80",
                    borderThickness: 0,
                    points:
                    {
                        type: "xy",
                        data: residuals
                    }
                }
            ],
        };
        ReportHelpers.renderChart(chart, chartConfig, cvsIDBase + "_res");
    });
}

async function loadTimestamps(url)
{
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Float64Array(buffer);
}

function canvasIDBase(paramName, detectorName, coord)
{
    return `lo_calib_param_${paramName}_${detectorName}_${coord}`;
}

function cmos(n, param, coord)
{
    const detector = param.detectors[n];
    const width = ReportHelpers.calcChartWidth(4, 0, 50);
    const cvsIDBase = canvasIDBase(param.name, detector.name, coord);
    return `
        <h3>${detector.name}</h3>
        <div class="report-detector-dashrow">
            <div onclick="NChart3DLib.chart.${cvsIDBase}();">
                <canvas id="${cvsIDBase}_val" style="width: ${width}px; height: 200px;"></canvas>
                <canvas id="${cvsIDBase}_res" style="width: ${width}px; height: 200px;"></canvas>
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
            const cvsIDBaseEta = canvasIDBase(stats.params[p].name, stats.params[p].detectors[n].name, "eta");
            const cvsIDBaseZeta = canvasIDBase(stats.params[p].name, stats.params[p].detectors[n].name, "zeta");
            await plotValues(stats.params[p].detectors[n].etaValues[0].data,
                             stats.params[p].detectors[n].etaFit[0].data,
                             n == 0 || n == 3 ? "#FF7F7F" : "#60CCE8",
                             cvsIDBaseEta);
            await plotResiduals(stats.params[p].detectors[n].etaResiduals[0].data,
                                cvsIDBaseEta);
            await plotValues(stats.params[p].detectors[n].zetaValues[0].data,
                             stats.params[p].detectors[n].zetaFit[0].data,
                             n == 0 || n == 3 ? "#60CCE8" : "#FF7F7F",
                             cvsIDBaseZeta);
            await plotResiduals(stats.params[p].detectors[n].zetaResiduals[0].data,
                                cvsIDBaseZeta);
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildLOCalib(INPUT["Solution"]);
}
