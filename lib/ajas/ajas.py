
import lib.ajas.raccoons as raccoons

def get_mission_overview(solutionID: str) -> dict:
    return GLOB[solutionID].mission_overview()

def get_solution_stats(solutionID: str) -> dict:
    return GLOB[solutionID].solution_stats()

def solution_id() -> str:
    return str(hash(SETTINGS_VAL["Input Data Path"] + SETTINGS_VAL["Solution Path"]))

if MODE == "INITIALIZATION":
    ipath = SETTINGS_VAL["Input Data Path"]
    spath = SETTINGS_VAL["Solution Path"]
    GLOB[solution_id()] = raccoons.Engine(ipath + "/obs.dat", ipath + "/src.dat", spath)
if MODE == "RUNNING":
    OUTPUT["Solution"] = solution_id()
