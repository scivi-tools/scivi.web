
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
            SCIVI.runTemplate(ReportHelpers.histogramTemplate(chartConfig));
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
            <table style="width: 100px">
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
            <div style="width: ${ReportHelpers.calcChartWidth(4, 0, 500)}px; height: 200px;" onclick="NChart3DLib.chart.${canvasID}();">
                <canvas id="${canvasID}" style="width: 100%; height: 100%;"></canvas>
            </div>
        </div>
    `;
}

async function buildResiduals(solutionID, studentised)
{
    const stats = await get_res_stats(solutionID, studentised);

    let res;
    let resID;
    let legend;
    if (studentised)
    {
        res = "Studentised Residuals";
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

    const html = `
        <h2>${res} Statistics</h2>
        <div class="report-dashrow">
            <div class="report-dashbox">
                <h3>${res} Statistics for 𝜂 [mas]</h3>
                <div class="report-detector-outer-dashrow">
                    <div class="report-dashbox">
                        ${cmos(0, stats, "eta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(1, stats, "eta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(2, stats, "eta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(3, stats, "eta", resID)}
                    </div>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>${res} Statistics for 𝜁 [mas]</h3>
                <div class="report-detector-outer-dashrow">
                    <div class="report-dashbox">
                        ${cmos(0, stats, "zeta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(1, stats, "zeta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(2, stats, "zeta", resID)}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(3, stats, "zeta", resID)}
                    </div>
                </div>
            </div>
        </div>
        ${legend}
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    for (let i = 0; i < 4; ++i)
    {
        const detector = stats["detectors"][i];
        await plotHistGauss(`${res} in 𝜂 [mas]`,
                            detector["name"],
                            detector["etaHist"],
                            stats["minX"], stats["maxX"], stats["minY"], stats["maxY"],
                            i == 0 || i == 3 ? "#FF7F7F" : "#60CCE8",
                            detector["etaGaussS1"],
                            detector["etaGauss"],
                            `${resID}${detector["name"]}etaHist`);
        await plotHistGauss(`${res} in 𝜁 [mas]`,
                            detector["name"],
                            detector["zetaHist"],
                            stats["minX"], stats["maxX"], stats["minY"], stats["maxY"],
                            i == 0 || i == 3 ? "#60CCE8" : "#FF7F7F",
                            detector["zetaGaussS1"],
                            detector["zetaGauss"],
                            `${resID}${detector["name"]}zetaHist`);
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
