
import lib.ajas.raccoons as raccoons

def get_mission_overview(solutionID: str) -> str:
    engine = raccoons.Engine(solutionID + "/obs.dat", solutionID + "/src.dat", solutionID + "/solution")
    return engine.mission_overview()

if MODE == "RUNNING":
    OUTPUT["Solution"] = "/Volumes/KR-ARI/jors-test"
