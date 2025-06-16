
async function buildStats(solutionID)
{
    const stats = await get_observations_stats(solutionID);
    let bullet = 1;
    const html = `
        <h2>Observational Statistics</h2>
        <h3>Observations per source</h3>
        <table>
            <tr>
                <td>${bullet++}.</td>
                <td>min</td>
                <td class="table-num">${stats["min"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>max</td>
                <td class="table-num">${stats["max"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>avg</td>
                <td class="table-num">${stats["avg"].toFixed(2)}</td>
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
    buildStats(INPUT["Solution"]);
}
