if (IN_VISUALIZATION) {
    if (HAS_INPUT["Picture"] && INPUT["Picture"] && !CACHE["cross"]) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";

        var imgFrame = document.createElement("div");
        imgFrame.style.width = "800px";
        imgFrame.style.position = "absolute";
        imgFrame.style.top = "50%";
        imgFrame.style.left = "50%";
        imgFrame.style.transform = "translate(-50%, -50%)";
        container.appendChild(imgFrame);

        var cross = document.createElement("div");
        cross.style.width = "10px";
        cross.style.height = "10px";
        cross.style.background = "radial-gradient(#FFF, #00ABFF, #000)";
        cross.style.borderRadius = "50%";
        cross.style.border = "#FFF solid 1px";
        cross.style.position = "absolute";
        cross.style.top = "50%";
        cross.style.left = "50%";
        cross.style.transform = "translate(-50%, -50%)";
        imgFrame.appendChild(cross);
        
        var img = document.createElement("img");
        img.src = INPUT["Picture"];
        img.style.width = "100%";
        imgFrame.appendChild(img);
        
        CACHE["cross"] = cross;
        ADD_VISUAL(container);
    }
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["cross"]) {
        var st = CACHE["cross"].style;
        var gaze = INPUT["Gaze"];
        st.left = (gaze[0] * 100.0) + "%";
        st.top = ((1.0 - gaze[1]) * 100.0) + "%";
    }
} else {
    CACHE["cross"] = null;
}
