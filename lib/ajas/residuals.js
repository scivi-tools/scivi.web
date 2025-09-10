
function table(res, name, headers, counts, mus, sigmas, gammas, kappas)
{
    return `
        <h3>${res} Statistical Moments for ${name} [mas]</h3>
        <table>
            <tr>
                <td class="table-head"></td>
                ${headers}
            </tr>
            <tr>
                <td>count</td>
                ${counts}
            </tr>
            <tr>
                <td>𝜇</td>
                ${mus}
            </tr>
            <tr>
                <td>𝜎</td>
                ${sigmas}
            </tr>
            <tr>
                <td>𝛾</td>
                ${gammas}
            </tr>
            <tr>
                <td>𝜅</td>
                ${kappas}
            </tr>
        </table>
    `;
}

function plotHistGauss(res, caption, data, thickness, gaussS1, gauss, canvas)
{
    NChart3DLib().then(mdl => {
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
                    caption: { text: "Amount" },
                    valueMask: "%.0f"
                }
            },
            series:
            [
                {
                    type: "column",
                    brush: "#60cce8",
                    borderBrush: "#000000",
                    borderThickness: 1,
                    name: res,
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
                    name: "Gaussian (σ = 1)",
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
                    name: "Gaussian",
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
        const chart = new mdl.NChart(canvas);
        chart.loadJSON(JSON.stringify(chartConfig));
    });
}

async function buildResiduals(solutionID, studentised)
{
    const res = studentised ? "Studentised Residuals" : "Residuals";
    const stats = await get_res_stats(solutionID, studentised);
    const detectors = stats["detectors"];
    let headers = "", counts = "";
    let etaMus = "", etaSigmas = "", etaGammas = "", etaKappas = "";
    let zetaMus = "", zetaSigmas = "", zetaGammas = "", zetaKappas = "";
    let hists = "";
    for (let i = 0, n = detectors.length; i < n; ++i)
    {
        headers += `<td class="table-head">${detectors[i]["name"]}</td>`;
        counts += `<td class="table-num">${detectors[i]["count"]}</td>`;

        etaMus += `<td class="table-num">${detectors[i]["etaMu"].toExponential(3)}</td>`;
        etaSigmas += `<td class="table-num">${detectors[i]["etaSigma"].toExponential(3)}</td>`;
        etaGammas += `<td class="table-num">${detectors[i]["etaGamma"].toExponential(3)}</td>`;
        etaKappas += `<td class="table-num">${detectors[i]["etaKappa"].toExponential(3)}</td>`;

        zetaMus += `<td class="table-num">${detectors[i]["zetaMu"].toExponential(3)}</td>`;
        zetaSigmas += `<td class="table-num">${detectors[i]["zetaSigma"].toExponential(3)}</td>`;
        zetaGammas += `<td class="table-num">${detectors[i]["zetaGamma"].toExponential(3)}</td>`;
        zetaKappas += `<td class="table-num">${detectors[i]["zetaKappa"].toExponential(3)}</td>`;

        hists += `
            <h3>${res} of ${detectors[i]["name"]} in 𝜂 [mas]</h3>
            <div style="width: calc(100vw - 200px); height: 400px;">
                <canvas id="${detectors[i]["name"]}etaHist" style="width: 100%; height: 100%;"></canvas>
            </div>
            <h3>${res} of ${detectors[i]["name"]} in 𝜁 [mas]</h3>
            <div style="width: calc(100vw - 200px); height: 400px;">
                <canvas id="${detectors[i]["name"]}zetaHist" style="width: 100%; height: 100%;"></canvas>
            </div>
        `;
    }
    const html = `
        <h2>${res} Statistics</h2>
        ${table(res, "𝜂", headers, counts, etaMus, etaSigmas, etaGammas, etaKappas)}
        ${table(res, "𝜁", headers, counts, zetaMus, zetaSigmas, zetaGammas, zetaKappas)}
        <h2>${res} Histograms</h2>
        ${hists}
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);

    for (let i = 0, n = detectors.length; i < n; ++i)
    {
        plotHistGauss(res, `${res} in 𝜂 [mas]`,
                      detectors[i]["etaHist"], detectors[i]["etaThickness"],
                      detectors[i]["etaGaussS1"], detectors[i]["etaGauss"],
                      `${detectors[i]["name"]}etaHist`);
        plotHistGauss(res, `${res} in 𝜁 [mas]`,
                      detectors[i]["zetaHist"], detectors[i]["zetaThickness"],
                      detectors[i]["zetaGaussS1"], detectors[i]["zetaGauss"],
                      `${detectors[i]["name"]}zetaHist`);
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildResiduals(INPUT["Solution"], SETTINGS_VAL["Studentised"]);
}
