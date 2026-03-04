/**
 * localib.js
 *
 * Part of the ARI/ZAH Layered Online Reduction Inspection System (LORIS).
 *
 * @author Konstantin Riabinin (konstantin.riabinin@uni-heidelberg.de)
 *
 * This script is a client-side worker displaying a report about lower-order calibration parameters.
 */

const VAL_NAME = "Calibration Parameter";
const VAL_COLOR1 = "#FF7F7F";
const VAL_COLOR2 = "#60CCE8";
const FUNC_NAME = "Fit of y = ax + b + c sin(dx + e)";
const FUNC_COLOR = "#B51700";
const RES_NAME = "Residuals to that function";
const RES_COLOR = "#004D80";
const RES_TRANS = "88";
const BORDER_COLOR = "#0000BB";

/**
 * Convert timestamp index to a date string.
 *
 * @param x - timestamp index.
 * @return date string.
 */
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

/**
 * Create a dictoionary describing a set of chart LODs.
 *
 * @param seriesType - string type of series.
 * @param color - series color.
 * @param lods - array of LODs settings.
 * @param addLODNames - flag, determining if LODs should have names (true) or not (false).
 * @param hostsOnSY - flag, determining if series is hosted by the secondary Y axis (true) or by the primary one
 *        (false).
 * @return discription of chart LODs.
 */
function makeLODs(seriesType, color, lods, addLODNames, hostsOnSY)
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
            series.borderBrush = BORDER_COLOR;
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
        legendMarkerSize: 0,
        hostsOnSY: hostsOnSY
    };
}

/**
 * Plot the chart.
 *
 * @param caption - chart caption.
 * @param valuesLODs - LODs of series representing the calibration values.
 * @param fitLODs - LODs of series representing the fitted function.
 * @param residualsLODs - LODs of series representing the residuals to the fitted function.
 * @param valuesColor - color of the series representing the calibration values.
 * @param cvsID - ID of the canvas to draw the chart on.
 * @param tsURL - URL to the file with timestamps.
 */
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
                minValue: -1,
                maxValue: CACHE["timestamps"].length,
                doubleToString: "NChart3DLib.ts2s",
                minTickSpacing: 0,
                maxLabelLength: 1000
            },
            yAxis:
            {
                valueMask: "%.0e",
                caption: { visible: true, font: { size: 13 }, text: "Parameter Value, [μas]" },
                font: { size: 13 },
                minTickSpacing: 0,
                maxLabelLength: 1000
            },
            syAxis:
            {
                valueMask: "%.0e",
                caption: { visible: true, font: { size: 13 }, text: "Residual, [μas]" },
                font: { size: 13 },
                minTickSpacing: 0,
                maxLabelLength: 1000
            },
            margin: [ 0, 0, 0, 0 ],
            plotAreaMargin: [ 0, 0, 0, 0 ]
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
                positiveColor: RES_COLOR + RES_TRANS,
                borderThickness: 0,
                points:
                {
                    type: "xLowHigh",
                    data: residualsLODs[0].data
                }
            },
            {
                type: "line",
                brush: FUNC_COLOR,
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
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            chartConfig.caption = { text: caption };
            chartConfig.series[0] = makeLODs("band", valuesColor, valuesLODs, false, false);
            chartConfig.series[0].lColor = valuesColor;
            chartConfig.series[0].lName = VAL_NAME;
            chartConfig.series[1] = makeLODs("band", RES_COLOR + RES_TRANS, residualsLODs, true, true);
            chartConfig.series[1].lColor = RES_COLOR;
            chartConfig.series[1].lName = RES_NAME;
            chartConfig.series[2] = makeLODs("line", FUNC_COLOR, fitLODs, false, false);
            chartConfig.series[2].lColor = FUNC_COLOR;
            chartConfig.series[2].lName = FUNC_NAME;
            delete chartConfig.cartesianSystem.xAxis.font;
            delete chartConfig.cartesianSystem.xAxis.caption.font;
            delete chartConfig.cartesianSystem.yAxis.font;
            delete chartConfig.cartesianSystem.yAxis.caption.font;
            delete chartConfig.cartesianSystem.syAxis.font;
            delete chartConfig.cartesianSystem.syAxis.caption.font;
            SCIVI.forkWithTemplate(ReportHelpers.loCalibMonTemplate(chartConfig,
                                                                    tsURL,
                                                                    INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, cvsID);
    });
}

/**
 * Load the array of timestamps from a file.
 *
 * @param url - URL to the file with timestamps.
 * @return array of timestamps.
 */
async function loadTimestamps(url)
{
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Float64Array(buffer);
}

/**
 * Compose the canvas ID.
 *
 * @param paramName - name of the calibration parameter.
 * @param detectorName - name of the detector,
 * @param coord - name of the coordinate.
 * @return canvas ID.
 */
function canvasID(paramName, detectorName, coord)
{
    return `lo_calib_param_${paramName}_${detectorName}_${coord}`;
}

/**
 * Generate HTML for an individual detector.
 *
 * @param n - number of the detector.
 * @param param - dictionary describing the calibration parameter.
 * @param coord - name of the coordinate.
 * @return HTML of a detector.
 */
function cmos(n, param, coord)
{
    const detector = param.detectors[n];
    const width = ReportHelpers.calcChartWidth(4, 0, 50);
    const cvsID = canvasID(param.name, detector.name, coord);
    return `
        <h3>${detector.name}</h3>
        <div class="report-detector-dashrow">
            ${ReportHelpers.placeChart(cvsID, width, 200)}
        </div>
    `;
}

/**
 * Generate HTML for an individual calibration parameter.
 *
 * @param param - dictionary describing the calibration parameter.
 * @param legend - HTML of a legend.
 * @return HTML of a calibration parameter.
 */
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

/**
 * Slider callback for calibration parameter selection.
 *
 * @param params - array of calibration parameter descriptions.
 * @param paramName - calibration paremeter name.
 */
function selectParam(params, paramName)
{
    for (let i = 0; i < params.length; ++i)
        document.getElementById(`lo_calib_param_${params[i].name}`).style.display = paramName === params[i].name ? "" : "none";
}

/**
 * Display the lower-order calibration parameters report.
 *
 * @param solutionID - colution ID.
 */
async function buildLOCalib(solutionID)
{
    const stats = await get_lo_calib_stats(solutionID);
    CACHE["timestamps"] = await loadTimestamps(stats.timestamps);

    const legend = `
        <div class="report-dashrow" style="justify-content: center; align-items: center; column-gap: 10px; margin-bottom: 20px; margin-top: 10px;">
            <div class="report-legend-square" style="background-color: ${VAL_COLOR1}"></div>
            <div class="report-legend-square" style="background-color: ${VAL_COLOR2}"></div>
            <div style="margin-right: 20px;">${VAL_NAME}</div>
            <div class="report-legend-square" style="background-color: ${FUNC_COLOR}"></div>
            <div>${FUNC_NAME}</div>
            <div class="report-legend-square" style="background-color: ${RES_COLOR}"></div>
            <div style="margin-right: 20px;">${RES_NAME}</div>
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
                       n == 0 || n == 3 ? VAL_COLOR1 : VAL_COLOR2,
                       canvasID(stats.params[p].name, stats.params[p].detectors[n].name, "eta"),
                       stats.timestamps);
            await plot(`Calibration Parameters Δ𝜁${stats.params[p].name} of ${stats.params[p].detectors[n].name}`,
                       stats.params[p].detectors[n].zetaValues,
                       stats.params[p].detectors[n].zetaFit,
                       stats.params[p].detectors[n].zetaResiduals,
                       n == 0 || n == 3 ? VAL_COLOR2 : VAL_COLOR1,
                       canvasID(stats.params[p].name, stats.params[p].detectors[n].name, "zeta"),
                       stats.timestamps);
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildLOCalib(INPUT["Solution"]);
}
