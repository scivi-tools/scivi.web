
function table(name, headers, counts, mus, sigmas, gammas, kappas)
{
    return `
        <h3>Residuals Statistical Moments for ${name} [mas]</h3>
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

async function buildResiduals(solutionID)
{
    const stats = await get_res_stats(solutionID);
    const detectors = stats["detectors"];
    let headers = "", counts = "";
    let etaMus = "", etaSigmas = "", etaGammas = "", etaKappas = "";
    let zetaMus = "", zetaSigmas = "", zetaGammas = "", zetaKappas = "";
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
    }
    const html = `
        <h2>Residuals Statistics</h2>
        ${table("𝜂", headers, counts, etaMus, etaSigmas, etaGammas, etaKappas)}
        ${table("𝜁", headers, counts, zetaMus, zetaSigmas, zetaGammas, zetaKappas)}
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildResiduals(INPUT["Solution"]);
}
