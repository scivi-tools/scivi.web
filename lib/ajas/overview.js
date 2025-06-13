
function twoDigits(t)
{
    return String(t).padStart(2, "0");
}

function formatTime(ms)
{
    const hh = Math.floor(ms / 3600000.0);
    const mm = Math.floor(ms / 60000.0 - hh * 60.0);
    const ss = Math.floor(ms / 1000.0 - hh * 3600.0 - mm * 60.0);
    const mms = ms - hh * 3600000.0 - mm * 60000.0 - ss * 1000.0;
    return `${twoDigits(hh)}:${twoDigits(mm)}:${twoDigits(ss)}.${mms}`;
}

async function apiTest(solutionID)
{
    const overview = await get_mission_overview(solutionID);
    const stats = await get_solution_stats(solutionID);
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
        <h2>AJAS Statistics</h2>
        <table>
            <tr>
                <td>${bullet = 1, bullet++}.</td>
                <td>AJAS Git hash</td>
                <td class="table-num">${stats["gitHash"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Process grid</td>
                <td class="table-num">${stats["gridWidth"]} ⨯ ${stats["gridHeight"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Number of building threads per process</td>
                <td class="table-num">${stats["buildThreads"]}</td>
            </tr>
            <tr class="hline">
                <td>${bullet++}.</td>
                <td>Number of summation threads per process</td>
                <td class="table-num">${stats["sumThreads"]}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Matrix building time</td>
                <td class="table-num">${formatTime(stats["matrixBuildingTime"])}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Eigenproblem solving time</td>
                <td class="table-num">${formatTime(stats["eigenSolvingTime"])}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Eigenvalues filtering time</td>
                <td class="table-num">${formatTime(stats["eigenFilteringTime"])}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Pseudoinverse matrix calculation time</td>
                <td class="table-num">${formatTime(stats["pseudoInverseTime"])}</td>
            </tr>
            <tr class="hline">
                <td>${bullet++}.</td>
                <td>Backsubstitution and resudiuals calculation time</td>
                <td class="table-num">${formatTime(stats["residualsTime"])}</td>
            </tr>
            <tr>
                <td>${bullet++}.</td>
                <td>Total solving time</td>
                <td class="table-num">${formatTime(stats["matrixBuildingTime"] + stats["eigenSolvingTime"] + stats["eigenFilteringTime"] + stats["pseudoInverseTime"] + stats["residualsTime"])}</td>
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
