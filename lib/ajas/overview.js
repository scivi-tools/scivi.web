
async function apiTest(solutionID)
{
    let overview = await get_mission_overview(solutionID);
    let bullet = 1;
    const html = `
        <h2>Mission Overview</h2>
        <table>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of sources</td>
                <td class="table-num">${overview["Lambda"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of Gaia priors</td>
                <td class="table-num">${overview["LambdaGaia"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of exposures</td>
                <td class="table-num">${overview["UpsilonUnits"][0]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of detectors</td>
                <td class="table-num">${overview["N"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of astrometric parameters</td>
                <td class="table-num">${overview["A"]}</td>
            </tr>
            <tr class="hline">
                <td>${bullet++}.</td>
                <td>Number of calibration orders</td>
                <td class="table-num">${overview["Upsilon"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of units of each order</td>
                <td class="table-num">[ ${overview["UpsilonUnits"]} ]</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of 2D-observations</td>
                <td class="table-num">${overview["L"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of unknowns in the system</td>
                <td class="table-num">${overview["unknowns"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of equations in the system</td>
                <td class="table-num">${overview["equations"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Size of reduced normal matrix of the system</td>
                <td class="table-num">${overview["m"]}</td>
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
    apiTest(INPUT["Solution"]);
}
