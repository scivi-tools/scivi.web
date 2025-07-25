
async function buildSources(solutionID)
{
    const stats = await get_src_stats(solutionID);
    console.log(stats);
    const html = `
        <h2>Source Statistics</h2>
        <h3>Source Updates Properties</h3>
        <table>
            <tr>
                <td class="table-head">Parameter</td>
                <td class="table-head">min</td>
                <td class="table-head">max</td>
                <td class="table-head">avg</td>
            </tr>
            <tr>
                <td>𝜐</td>
                <td class="table-num">${stats["minUpsilon"].toExponential(3)} ±${stats["minUpsilonUns"].toExponential(3)}</td>
                <td class="table-num">${stats["maxUpsilon"].toExponential(3)} ±${stats["maxUpsilonUns"].toExponential(3)}</td>
                <td class="table-num">${stats["avgUpsilon"].toExponential(3)} ±${stats["avgUpsilonUns"].toExponential(3)}</td>
            </tr>
            <tr>
                <td>𝜌</td>
                <td class="table-num">${stats["minRho"].toExponential(3)} ±${stats["minRhoUns"].toExponential(3)}</td>
                <td class="table-num">${stats["maxRho"].toExponential(3)} ±${stats["maxRhoUns"].toExponential(3)}</td>
                <td class="table-num">${stats["avgRho"].toExponential(3)} ±${stats["avgRhoUns"].toExponential(3)}</td>
            </tr>
        </table>
    `;

    const report = document.createElement("div");
    report.classList.add("report");
    report.innerHTML = html;
    ADD_VISUAL(report);
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    buildSources(INPUT["Solution"]);
}
