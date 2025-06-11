
async function apiTest(solutionID)
{
    let result = await get_mission_overview(solutionID);
    // let result = solutionID;
    console.log(result);
}

if (IN_VISUALIZATION && HAS_INPUT["Solution"] && INPUT["Solution"] != null)
{
    let solutionID = INPUT["Solution"];
    apiTest(solutionID);
}
