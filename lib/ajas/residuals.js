
function d2s(x)
{
    return (x / 1.0e5).toFixed(2);
}

async function createChart(func)
{
    if (!NChart3DLib.chart)
    {
        const mdl = await NChart3DLib();
        NChart3DLib.chart = new mdl.NChart();
    }
    func(NChart3DLib.chart);
}

function renderChart(chart, config, canvasID)
{
    const cvs = document.getElementById(canvasID);
    const cs = window.devicePixelRatio;
    cvs.width = cvs.scrollWidth * cs;
    cvs.height = cvs.scrollHeight * cs;
    chart.renderOn2DCanvas(JSON.stringify(config), canvasID, 0, 0, cvs.scrollWidth, cvs.scrollHeight);
}

function calcChartWidth(numChartsInRow, numOthersInRow, restInRow)
{
    const winPadding = 150 + 10 + 2 + 10 + 2; // actual window padding + dashbox padding left + border + dashbox padding right + border
    const interPadding = 10 + 2 + 20 + 10 + 2; // dashbox padding left + border + gap + dashbox padding right + border
    return Math.floor((window.innerWidth - winPadding -
                       interPadding * (numChartsInRow + numOthersInRow - 1) -
                       restInRow) / numChartsInRow);
}

async function plotHistGauss(caption, data, minX, maxX, minY, maxY, color, thickness, gaussS1, gauss, canvas)
{
    await createChart((chart) => {
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
                    minValue: minX,
                    maxValue: maxX
                },
                margin: [ 0, 0, 0, 0 ]
            },
            caption:
            {
                text: "Amount, 1e5",
                font: { size: 12 },
                blockAlignment: "topLeft"
            },
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
                    thickness: thickness
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
        renderChart(chart, chartConfig, canvas);
    });
}

function cmos(n, stats, coord, res)
{
    const detector = stats["detectors"][n];
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
            <div style="width: ${calcChartWidth(4, 0, 500)}px; height: 200px;">
                <canvas id="${res}${detector["name"]}${coord}Hist" style="width: 100%; height: 100%;"></canvas>
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
                            detector["etaHist"],
                            stats["minX"], stats["maxX"], stats["minY"], stats["maxY"],
                            i == 0 || i == 3 ? "#FF7F7F" : "#60CCE8",
                            detector["etaThickness"],
                            detector["etaGaussS1"],
                            detector["etaGauss"],
                            `${resID}${detector["name"]}etaHist`);
        await plotHistGauss(`${res} in 𝜁 [mas]`,
                            detector["zetaHist"],
                            stats["minX"], stats["maxX"], stats["minY"], stats["maxY"],
                            i == 0 || i == 3 ? "#60CCE8" : "#FF7F7F",
                            detector["zetaThickness"],
                            detector["zetaGaussS1"],
                            detector["zetaGauss"],
                            `${resID}${detector["name"]}zetaHist`);
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
