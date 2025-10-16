
function d2s(x)
{
    return (x / 1.0e5).toFixed(2);
}

async function plotHistGauss(caption, detector, data, minX, maxX, minY, maxY, color, gaussS1, gauss, canvas)
{
    await ReportHelpers.createChart((chart) => {
        NChart3DLib.d2s = d2s;
        const chartConfig = {
            shouldAntialias: true,
            cartesianSystem:
            {
                xAxis:
                {
                    caption: { text: caption },
                    valueMask: "%.1f",
                    hasOffset: false,
                    minValue: minX,
                    maxValue: maxX,
                    shouldBeautifyMinAndMax: false
                },
                yAxis:
                {
                    doubleToString: "NChart3DLib.d2s",
                    valueMask: "%.1f",
                    caption: { text: "" },
                    minValue: minY,
                    maxValue: maxY
                },
                margin: [ 0, 0, 0, 0 ]
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
            SCIVI.forkWithTemplate(ReportHelpers.histogramTemplate(chartConfig));
        };
        ReportHelpers.renderChart(chart, chartConfig, canvas);
    });
}

function cmos(n, stats, coord, res)
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
            <div onclick="NChart3DLib.chart.${canvasID}();">
                <canvas id="${canvasID}" style="width: ${ReportHelpers.calcChartWidth(4, 0, 490)}px; height: 200px;"></canvas>
            </div>
        </div>
    `;
}

function buildSubsetSlice(stats, subsetIndex, sliceIndex, res, resID, legend)
{
    subsetSlice = stats.subsets[subsetIndex].slices[sliceIndex];
    resID += `_${subsetIndex}_${sliceIndex}`;
    return `
        <h3>${subsetSlice.name}</h3>
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
    `;
}

function buildSubset(stats, subsetIndex, res, resID, legend)
{
    const subset = stats.subsets[subsetIndex];
    let result = `<h2>${res} Statistics: ${subset.name}</h2>`;
    for (let i = 0, n = subset.slices.length; i < n; ++i)
        result += buildSubsetSlice(stats, subsetIndex, i, res, resID, legend);
    return result;
}

function selectTab(index)
{
    const view = CACHE["view"];
    const tabBar = view.firstChild;
    for (let i = 0, n = tabBar.childElementCount; i < n; ++i)
    {
        if (i === index)
        {
            tabBar.children[i].classList.add("scivi_tab_selected");
            view.children[i + 1].style.display = "";
        }
        else
        {
            tabBar.children[i].classList.remove("scivi_tab_selected");
            view.children[i + 1].style.display = "none";
        }
    }
}

async function buildResiduals(solutionID, studentised)
{
    const stats = await get_res_stats(solutionID, studentised);

    let res;
    let resAxis;
    let resID;
    let legend;
    if (studentised)
    {
        res = "Studentised Residuals";
        resAxis = "Stud. Residuals"
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
        resAxis = res;
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
    tabBar.classList.add("scivi_tabbar");
    tabBar.style.marginTop = "0px";
    view.appendChild(tabBar);
    CACHE["view"] = view;

    for (let i = 0, n = stats.subsets.length; i < n; ++i) {
        const tab = document.createElement("button");
        tab.classList.add("scivi_tab");
        tab.textContent = stats.subsets[i].name;
        tab.onclick = () => { selectTab(i); };
        tabBar.appendChild(tab);

        const report = document.createElement("div");
        report.classList.add("report");
        report.style.height = "calc(100vh - 91px)";
        report.innerHTML = buildSubset(stats, i, res, resID, legend);
        view.appendChild(report);
    }

    ADD_TAB(view, resAxis);

    selectTab(0);

    for (let subsetIdx = 0, numSubsets = stats.subsets.length; subsetIdx < numSubsets; ++subsetIdx)
    {
        const subset = stats.subsets[subsetIdx];
        for (let sliceIdx = 0, numSlices = subset.slices.length; sliceIdx < numSlices; ++sliceIdx)
        {
            const subsetSlice = subset.slices[sliceIdx];
            const curResID = resID + `_${subsetIdx}_${sliceIdx}`;
            for (let n = 0; n < 4; ++n)
            {
                const detector = subsetSlice.detectors[n];
                await plotHistGauss(`${resAxis} in 𝜂 [mas]`,
                                    detector.name,
                                    detector.etaHist,
                                    stats.minX, stats.maxX, stats.minY, stats.maxY,
                                    n == 0 || n == 3 ? "#FF7F7F" : "#60CCE8",
                                    detector.etaGaussS1,
                                    detector.etaGauss,
                                    `${curResID}${detector.name}etaHist`);
                await plotHistGauss(`${resAxis} in 𝜁 [mas]`,
                                    detector.name,
                                    detector.zetaHist,
                                    stats.minX, stats.maxX, stats.minY, stats.maxY,
                                    n == 0 || n == 3 ? "#60CCE8" : "#FF7F7F",
                                    detector.zetaGaussS1,
                                    detector.zetaGauss,
                                    `${curResID}${detector.name}zetaHist`);
            }
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
