if (HAS_INPUT["Orientation"]) {
    coords = orientation2Coords(INPUT["Orientation"]);
    OUTPUT["Detected"] = coords[1] < -0.7;
}