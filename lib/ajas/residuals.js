/**
 * residuals.js
 *
 * Part of the ARI/ZAH Layered Online Reduction Inspection System (LORIS).
 *
 * @author Konstantin Riabinin (konstantin.riabinin@uni-heidelberg.de)
 *
 * This script is a client-side worker displaying a report about residuals.
 */

/**
 * Convert double to string.
 *
 * @param x - value.
 * @return string representation of the value.
 */
function d2s(x)
{
    return (x / 1.0e5).toFixed(2);
}

/**
 * Generate the plot of a histogram with Gaussian fitted to it.
 *
 * @param caption - chart caption.
 * @param detector - name of the corresponding detector.
 * @param data - histogram values.
 * @param minX - minimum on the X axis.
 * @param maxX - maximum on the X axis.
 * @param minY - minimum on the Y axis.
 * @param maxY - maximum on the Y axis.
 * @param color - histogram color.
 * @param gaussS1 - values of the Gaussian with `sigma = 1`.
 * @param gauss - values of the Gaussian.
 * @param canvas - canvas ID to draw the chart on.
 */
async function plotHistGauss(caption, detector, data, minX, maxX, minY, maxY, color, gaussS1, gauss, canvas)
{
    await ReportHelpers.createChart((chart) => {
        NChart3DLib.residualsD2s = d2s;
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: {
                        text: caption,
                        font: { size: 12 }
                    },
                    font: { size: 12 },
                    valueMask: "%.1f",
                    hasOffset: false,
                    minValue: minX,
                    maxValue: maxX,
                    shouldBeautifyMinAndMax: false,
                    minTickSpacing: 0,
                    maxLabelLength: 1000
                },
                yAxis:
                {
                    doubleToString: "NChart3DLib.residualsD2s",
                    valueMask: "%.1f",
                    caption: { text: "" },
                    font: { size: 12 },
                    minValue: minY,
                    maxValue: maxY,
                    minTickSpacing: 0,
                    maxLabelLength: 1000
                },
                margin: [ 0, 0, 0, 0 ],
                plotAreaMargin: [ 45, 10, 45, 5 ]
            },
            caption:
            {
                text: "Amount, 1e5",
                font: { size: 12 },
                blockAlignment: "topLeft",
                visible: true
            },
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
                        data: data
                    }
                },
                {
                    type: "line",
                    brush: "#B51700",
                    lineThickness: 3,
                    points:
                    {
                        type: "xy",
                        data: gauss
                    }
                }
            ],
            seriesSettings:
            {
                column:
                {
                    thickness: (maxX - minX) / (data.length / 2)
                }
            }
        };
        if (gaussS1)
        {
            chartConfig.series.push({
                type: "line",
                brush: "#004D80",
                lineThickness: 3,
                points:
                {
                    type: "xy",
                    data: gaussS1
                }
            });
        }
        chart[canvas] = () => {
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            delete chartConfig.cartesianSystem.plotAreaMargin;
            chartConfig.caption = { visible: true, text: caption + " of " + detector };
            delete chartConfig.cartesianSystem.yAxis.doubleToString;
            chartConfig.cartesianSystem.yAxis.caption = "Amount";
            chartConfig.cartesianSystem.yAxis.valueMask = "%.1e";
            chartConfig.series[0].name = "Residuals";
            chartConfig.series[0].type = "column";
            chartConfig.series[0].borderThickness = 1.0;
            chartConfig.series[0].borderBrush = "#000000";
            chartConfig.series[1].name = "Gaussian";
            if (gaussS1)
                chartConfig.series[2].name = "Gaussian (σ = 1)";
            SCIVI.forkWithTemplate(ReportHelpers.histogramTemplate(chartConfig, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, canvas);
    });
}

/**
 * Generate the plot of a heatmap.
 *
 * @param detector - name of the corresponding detector.
 * @param xAxisName - name of the X axis.
 * @param yAxisName - name of the Y axis.
 * @param dataURL - URL to the file with the data.
 * @param minV - minimum value.
 * @param maxV - maximum value.
 * @param canvas - canvas ID to draw the chart on.
 */
async function plotHeatmap(detector, xAxisName, yAxisName, dataURL, minV, maxV, canvas)
{
    await ReportHelpers.createChart((chart) => {
        const scale = {
            brushes: [ "#E40303", "#FF8C00", "#FFD000", "#00CF3D", "#0072FF", "#000000" ],
            minValue: 1,
            maxValue: maxV,
            isGradient: true,
            isStrict: true
        };
        const chartConfig = {
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: xAxisName, font: { size: 13 } },
                    valueMask: "%.1f",
                    hasOffset: false,
                    font: { size: 13 },
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    valueMask: "%.1f",
                    caption: { text: yAxisName, font: { size: 13 } },
                    hasOffset: false,
                    font: { size: 13 },
                    shouldBeautifyMinAndMax: false
                },
                margin: [ 0, 0, 0, 0 ]
            },
            caption: { visible: false },
            shouldAntialias: false,
            adaptiveAntialiasing: false,
            series:
            [
                {
                    type: "heatmap",
                    scale: scale,
                    points:
                    {
                        type: "xyValue",
                        data: dataURL
                    }
                }
            ],
            legend: { visible: false },
            scaleLegends:
            [
                {
                    scale: scale,
                    valueMask: "%.0f",
                    blockAlignment: "right",
                    labelPosition: "right",
                    contentAlignment: "left",
                    markerSize: [ 10, 10 ],
                    isContinuous: true,
                    margin: [ 0, 0, 29, -13 ],
                    font: { size: 13 }
                }
            ]
        };
        chart[canvas] = () => {
            chartConfig.cartesianSystem.margin = [ 10, 10, 10, 10 ];
            chartConfig.caption = { visible: true, text: xAxisName + " on " + detector };
            delete chartConfig.cartesianSystem.xAxis.font;
            delete chartConfig.cartesianSystem.xAxis.caption.font;
            delete chartConfig.cartesianSystem.yAxis.font;
            delete chartConfig.cartesianSystem.yAxis.caption.font;
            delete chartConfig.scaleLegends[0].font;
            SCIVI.forkWithTemplate(ReportHelpers.heatmapTemplate(chartConfig, INPUT["Solution"]));
        };
        ReportHelpers.renderChart(chart, chartConfig, canvas);
    });
}

/**
 * Generate HTML of a histogram for an individual detector.
 *
 * @param n - number of the detector.
 * @param stats - dictionary descriping the residuals statistics.
 * @param coord - coordinate to generate for.
 * @param res - name of the residuals subset.
 * @return HTML of the detector's view.
 */
function cmosHistogram(n, stats, coord, res)
{
    const detector = stats["detectors"][n];
    const canvasID = `${res}${detector["name"]}${coord}Hist`;
    return `
        <h3>${detector["name"]}</h3>
        <div class="report-detector-dashrow">
            <table style="width: 110px">
                <tr>
                    <td><i>N</i></td>
                    <td>${detector["count"]}</td>
                </tr>
                <tr>
                    <td>𝜇</td>
                    <td>${detector[coord + "Mu"].toExponential(3)}</td>
                </tr>
                <tr>
                    <td>𝜎</td>
                    <td>${detector[coord + "Sigma"].toExponential(3)}</td>
                </tr>
                <tr>
                    <td>𝛾</td>
                    <td>${detector[coord + "Gamma"].toExponential(3)}</td>
                </tr>
                <tr>
                    <td>𝜅</td>
                    <td>${detector[coord + "Kappa"].toExponential(3)}</td>
                </tr>
            </table>
            ${ReportHelpers.placeChart(canvasID, ReportHelpers.calcChartWidth(4, 0, 490), 200)}
        </div>
    `;
}

/**
 * Generate HTML of a heatmap for an individual detector.
 *
 * @param n - number of the detector.
 * @param stats - dictionary descriping the residuals statistics.
 * @param coord - coordinate to generate for.
 * @param res - name of the residuals subset.
 * @return HTML of the detector's view.
 */
function cmosHeatmap(n, stats, coord, res)
{
    const detector = stats["detectors"][n];
    const canvasID = `${res}${detector["name"]}${coord}Heatmap`;
    return `
        <h3>${detector["name"]}</h3>
        <div class="report-detector-dashrow">
            ${ReportHelpers.placeChart(canvasID, ReportHelpers.calcChartWidth(4, 0, 50), 200)}
        </div>
    `;
}

/**
 * Generate HTML for an individual detector.
 *
 * @param n - number of the detector.
 * @param stats - dictionary descriping the residuals statistics.
 * @param coord - coordinate to generate for.
 * @param res - name of the residuals subset.
 * @return HTML of the detector's view.
 */
function cmos(n, stats, coord, res)
{
    switch (stats["chart"])
    {
        case "column":
            return cmosHistogram(n, stats, coord, res);

        case "heatmap":
            return cmosHeatmap(n, stats, coord, res);

        default:
            return "";
    }
}

/**
 * Generate HTML for a subset slice of residuals.
 *
 * @param subsetSlice - subset slice as a dictionary.
 * @param subsetIndex - subset index.
 * @param sliceIndex - slice index.
 * @param res - name of the residuals subset.
 * @param resID - unique name-like identifier of the residuals subset.
 * @param legend - HTML of a legend.
 * @return HTML representation of a subset slice of residuals.
 */
function buildSubsetSlice(subsetSlice, subsetIndex, sliceIndex, res, resID, legend)
{
    resID += `_${subsetIndex}_${sliceIndex}`;
    return `
        <div id="${resID}_slice">
            <div class="report-dashrow">
                <div class="report-detector-dashbox">
                    <h3>${res} Statistics for 𝜂 [mas]</h3>
                    <div class="report-detector-outer-dashrow">
                        <div class="report-detector-dashbox">
                            ${cmos(0, subsetSlice, "eta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(1, subsetSlice, "eta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(2, subsetSlice, "eta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(3, subsetSlice, "eta", resID)}
                        </div>
                    </div>
                </div>
                <div class="report-detector-dashbox">
                    <h3>${res} Statistics for 𝜁 [mas]</h3>
                    <div class="report-detector-outer-dashrow">
                        <div class="report-detector-dashbox">
                            ${cmos(0, subsetSlice, "zeta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(1, subsetSlice, "zeta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(2, subsetSlice, "zeta", resID)}
                        </div>
                        <div class="report-detector-dashbox">
                            ${cmos(3, subsetSlice, "zeta", resID)}
                        </div>
                    </div>
                </div>
            </div>
            ${legend}
        </div>
    `;
}

/**
 * Generate HTML for a subset of residuals.
 *
 * @param stats - dictionary of residuals statistics.
 * @param subsetIndex - subset index.
 * @param res - name of the residuals subset.
 * @param resID - unique name-like identifier of the residuals subset.
 * @param legend - HTML of a legend.
 * @return HTML representation of a subset of residuals.
 */
function buildSubset(stats, subsetIndex, res, resID, legend)
{
    const subset = stats.subsets[subsetIndex];
    let result = `<h2>${res} Statistics: ${subset.name}</h2>`;
    const dims = subset.dimensions;
    if (dims !== undefined)
    {
        result += `<div class="report-dimensions">`;
        for (let i = 0, n = dims.length; i < n; ++i)
        {
            result += `
                <div class="report-dimensions-row">
                    <div class="report-dimensions-col">
                        <h3>${dims[i].name}:</h3>
                    </div>
                    <div class="report-dimensions-col">
                        <div class="report-subsets-slider"
                             style="width: ${Math.min((dims[i].ticks.length - 1) * 100, 700)}px"
                             id="${resID}_${subsetIndex}_${i}_dimension"/>
                        </div>
                    </div>
                </div>
            `;
        }
        result += `</div>`;
    }
    for (let i = 0, j = 0, k = 0, n = subset.slices.length; i < n; ++i, ++k)
    {
        result += buildSubsetSlice(subset.slices[i], subsetIndex, i, res, resID,
                                   subset.slices[i].chart === "column" ? legend : "");
    }
    return result;
}

/**
 * Select a tab with residuals subset.
 *
 * @param index - tab index.
 */
function selectTab(index)
{
    const view = CACHE["view"];
    const tabBar = view.firstChild;
    for (let i = 0, n = tabBar.childElementCount; i < n; ++i)
    {
        if (i === index)
        {
            tabBar.children[i].classList.add("report-tab-selected");
            view.children[i + 1].style.display = "";
        }
        else
        {
            tabBar.children[i].classList.remove("report-tab-selected");
            view.children[i + 1].style.display = "none";
        }
    }
}

/**
 * Select slice of a residuals subset.
 *
 * @param subsetIndex - subset index.
 * @param dims - array of dimensions inside of a subset.
 * @param resID - unique name-like identifier of the residuals subset.
 */
function selectSlice(subsetIndex, dims, resID)
{
    let index = 0;
    let slicesCnt = 1;
    for (let i = 0, n = dims.length; i < n; ++i)
    {
        const slider = document.getElementById(`${resID}_${subsetIndex}_${i}_dimension`);
        if (slider.noUiSlider !== undefined)
        {
            let value = dims[i].ticks.indexOf(slider.noUiSlider.get());
            slicesCnt *= dims[i].ticks.length;
            for (let j = i + 1; j < n; ++j)
                value *= dims[j].ticks.length;
            index += value;
        }
    }
    for (let i = 0; i < slicesCnt; ++i)
        document.getElementById(`${resID}_${subsetIndex}_${i}_slice`).style.display = i === index ? "" : "none";
}

/**
 * Display the residuals report.
 *
 * @param solutionID - solution ID.
 * @param studentised - flag, determining if the residuals are studentised (true) or not (false).
 */
async function buildResiduals(solutionID, studentised)
{
    const stats = await get_res_stats(solutionID, studentised);

    let res;
    let resAxis;
    let resTab;
    let resID;
    let legend;
    if (studentised)
    {
        res = "Studentised Residuals";
        resAxis = "Stud. Resid.";
        resTab = "Stud. Residuals";
        resID = "s_";
        legend = `
            <div class="report-dashrow" style="justify-content: center; align-items: center; column-gap: 10px; margin-bottom: 20px; margin-top: 10px;">
                <div class="report-legend-square" style="background-color: #FF7F7F"></div>
                <div class="report-legend-square" style="background-color: #60CCE8"></div>
                <div style="margin-right: 20px;">Residuals</div>
                <div class="report-legend-square" style="background-color: #B51700"></div>
                <div>Gaussian</div>
                <div class="report-legend-square" style="background-color: #004D80"></div>
                <div style="margin-right: 20px;">Gaussian (σ = 1)</div>
            </div>`;
    }
    else
    {
        res = "Residuals";
        resAxis = "Resid.";
        resTab = res;
        resID = "";
        legend = `
            <div class="report-dashrow" style="justify-content: center; align-items: center; column-gap: 10px; margin-bottom: 20px; margin-top: 10px;">
                <div class="report-legend-square" style="background-color: #FF7F7F"></div>
                <div class="report-legend-square" style="background-color: #60CCE8"></div>
                <div style="margin-right: 20px;">Residuals</div>
                <div class="report-legend-square" style="background-color: #B51700"></div>
                <div>Gaussian</div>
            </div>`;
    }

    const view = document.createElement("div");
    const tabBar = document.createElement("div");
    tabBar.classList.add("report-tabbar");
    tabBar.style.marginTop = "0px";
    view.appendChild(tabBar);
    CACHE["view"] = view;

    for (let i = 0, n = stats.subsets.length; i < n; ++i)
    {
        const tab = document.createElement("button");
        tab.classList.add("report-tab");
        tab.textContent = stats.subsets[i].name;
        tab.onclick = () => { selectTab(i); };
        tabBar.appendChild(tab);

        const report = document.createElement("div");
        report.classList.add("report");
        report.style.height = "calc(100vh - 91px)";
        report.innerHTML = buildSubset(stats, i, res, resID, legend);
        view.appendChild(report);
    }

    ADD_TAB(view, resTab);

    for (let i = 0, n = stats.subsets.length; i < n; ++i)
    {
        const subset = stats.subsets[i];
        const dims = subset.dimensions;
        for (let j = 0, m = dims !== undefined ? dims.length : 0; j < m; ++j)
        {
            const slider = document.getElementById(`${resID}_${i}_${j}_dimension`);
            const format = {
                from: (value) => { return dims[j].ticks.indexOf(value); },
                to: (value) => { return dims[j].ticks[Math.round(value)]; }
            };
            noUiSlider.create(slider, {
                start: [ 0 ],
                range:
                {
                    min: 0,
                    max: dims[j].ticks.length - 1
                },
                step: 1,
                behaviour: "smooth-steps-tap",
                format: format,
                pips:
                {
                    mode: "steps",
                    format: format,
                    density: 100 / (dims[j].ticks.length - 1)
                },
                tooltips: true
            });
            slider.noUiSlider.on("update", (values, handle) => {
                selectSlice(i, dims, resID);
            });
        }
    }

    selectTab(0);

    for (let subsetIdx = 0, numSubsets = stats.subsets.length; subsetIdx < numSubsets; ++subsetIdx)
    {
        const subset = stats.subsets[subsetIdx];
        const limits = subset.limits;
        for (let sliceIdx = 0, numSlices = subset.slices.length; sliceIdx < numSlices; ++sliceIdx)
        {
            const subsetSlice = subset.slices[sliceIdx];
            const curResID = resID + `_${subsetIdx}_${sliceIdx}`;
            switch (subsetSlice.chart)
            {
                case "column":
                    for (let n = 0; n < 4; ++n)
                    {
                        const detector = subsetSlice.detectors[n];
                        await plotHistGauss(`${resAxis} in 𝜂 [mas]`,
                                            detector.name,
                                            detector.etaHist,
                                            limits.minX, limits.maxX, limits.minY, limits.maxY,
                                            n == 0 || n == 3 ? "#FF7F7F" : "#60CCE8",
                                            detector.etaGaussS1,
                                            detector.etaGauss,
                                            `${curResID}${detector.name}etaHist`);
                        await plotHistGauss(`${resAxis} in 𝜁 [mas]`,
                                            detector.name,
                                            detector.zetaHist,
                                            limits.minX, limits.maxX, limits.minY, limits.maxY,
                                            n == 0 || n == 3 ? "#60CCE8" : "#FF7F7F",
                                            detector.zetaGaussS1,
                                            detector.zetaGauss,
                                            `${curResID}${detector.name}zetaHist`);
                    }
                    break;

                case "heatmap":
                    for (let n = 0; n < 4; ++n)
                    {
                        const detector = subsetSlice.detectors[n];
                        await plotHeatmap(detector.name,
                                          subset.name,
                                          `${resAxis} in 𝜂 [mas]`,
                                          detector.eta,
                                          detector.etaMin,
                                          detector.etaMax,
                                          `${curResID}${detector.name}etaHeatmap`);
                        await plotHeatmap(detector.name,
                                          subset.name,
                                          `${resAxis} in 𝜁 [mas]`,
                                          detector.zeta,
                                          detector.zetaMin,
                                          detector.zetaMax,
                                          `${curResID}${detector.name}zetaHeatmap`);
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
