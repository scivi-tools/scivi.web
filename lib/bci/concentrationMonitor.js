const STATE_RELAX = "#D5D5D5";
const STATE_CONCENTRATE = "#EE220C";

if (IN_VISUALIZATION) {
    if (!CACHE["monitor"]) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var monitor = document.createElement("div");
        monitor.style.width = "200px";
        monitor.style.height = "200px";
        monitor.style.position = "relative";
        monitor.style.top = "50%";
        monitor.style.left = "50%";
        monitor.style.transform = "translate(-50%, -50%)";
        monitor.style.background = "#D5D5D5";
        container.appendChild(monitor);

        CACHE["monitor"] = monitor;
        ADD_VISUAL(container);
    }
    if (HAS_INPUT["State"] && INPUT["State"]) {
        CACHE["monitor"].style.background = INPUT["State"] == "relax" ? STATE_RELAX : STATE_CONCENTRATE;
    }
} else {
    CACHE["monitor"] = undefined;
}
