
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

async function plotHistGauss(caption, data, thickness, gaussS1, gauss, canvas)
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
                    valueMask: "%.3e"
                },
                yAxis:
                {
                    caption: { text: "Amount, 1e5" },
                    doubleToString: "NChart3DLib.d2s"
                }
            },
            series:
            [
                {
                    type: "column",
                    brush: "#60cce8",
                    borderBrush: "#000000",
                    borderThickness: 1,
                    points:
                    {
                        type: "xy",
                        data: data
                    }
                },
                {
                    type: "line",
                    brush: "#F27200",
                    lineThickness: 2,
                    points:
                    {
                        type: "xy",
                        data: gaussS1
                    }
                },
                {
                    type: "line",
                    brush: "#D41876",
                    lineThickness: 2,
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
        renderChart(chart, chartConfig, canvas);
    });
}

function cmos(n, stats, coord)
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
            <div style="width: 160px; height: 200px;">
                <canvas id="${detector["name"] + coord}Hist" style="width: 100%; height: 100%;"></canvas>
            </div>
        </div>
    `;
}

async function buildResiduals(solutionID, studentised)
{
    const res = studentised ? "Studentised Residuals" : "Residuals";
    const stats = await get_res_stats(solutionID, studentised);

    const html = `
        <h2>${res} Statistics</h2>
        <div class="report-dashrow">
            <div class="report-dashbox">
                <h3>${res} Statistics for 𝜂 [mas]</h3>
                <div class="report-dashrow" style="width: 653px; row-gap: 5px;">
                    <div class="report-dashbox">
                        ${cmos(0, stats, "eta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(1, stats, "eta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(2, stats, "eta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(3, stats, "eta")}
                    </div>
                </div>
            </div>
            <div class="report-dashbox">
                <h3>${res} Statistics for 𝜁 [mas]</h3>
                <div class="report-dashrow" style="width: 653px; row-gap: 5px;">
                    <div class="report-dashbox">
                        ${cmos(0, stats, "zeta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(1, stats, "zeta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(2, stats, "zeta")}
                    </div>
                    <div class="report-dashbox">
                        ${cmos(3, stats, "zeta")}
                    </div>
                </div>
            </div>
        </div>
        <div class="report-dashrow" style="justify-content: center; align-items: center; column-gap: 10px; margin-bottom: 20px;">
            <div class="report-legend-square" style="background-color: #60cce8"></div>
            <div style="margin-right: 20px;">Residuals</div>
            <div class="report-legend-square" style="background-color: #f27200"></div>
            <div style="margin-right: 20px;">Gaussian (σ = 1)</div>
            <div class="report-legend-square" style="background-color: #d41876"></div>
            <div>Gaussian</div>
        </div>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    for (let i = 0; i < 4; ++i)
    {
        const detector = stats["detectors"][i];
        await plotHistGauss(`${res} in 𝜂 [mas]`,
                      detector["etaHist"], detector["etaThickness"],
                      detector["etaGaussS1"], detector["etaGauss"],
                      `${detector["name"]}etaHist`);
        await plotHistGauss(`${res} in 𝜁 [mas]`,
                      detector["zetaHist"], detector["zetaThickness"],
                      detector["zetaGaussS1"], detector["zetaGauss"],
                      `${detector["name"]}zetaHist`);
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    await buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
