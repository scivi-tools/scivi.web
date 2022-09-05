function inputValid(inp)
{
    return inp !== null && inp !== undefined;
}

if (HAS_INPUT["Frame Match"] && HAS_INPUT["Frame Index"] && HAS_INPUT["Frame Count"] && HAS_INPUT["Video Path"] && HAS_INPUT["Frame Path"]) {
    if (IN_VISUALIZATION) {
        var frameMatch = INPUT["Frame Match"];
        var frameIndex = INPUT["Frame Index"];
        var frameCount = INPUT["Frame Count"];
        var videoPath = INPUT["Video Path"];
        var framePath = INPUT["Frame Path"];
        if (inputValid(frameMatch) && inputValid(frameIndex) && inputValid(frameCount) && inputValid(videoPath) && inputValid(framePath)) {
            // console.log(frameMatch + " | " + frameIndex + " | " + frameCount + " | " + videoPath + " | " + framePath);
            var container = CACHE["div"];
            if (!container) {
                container = document.createElement("div");
                container.style.width = "100%";
                container.style.padding = "10px";
                container.style.marginTop = "50px";
                CACHE["div"] = container;
                ADD_VISUAL(container);
            }
            var curVideo = CACHE["curVideo"];
            var curProgess = CACHE["curProgress"];
            var curStep = CACHE["curStep"];
            if (curVideo !== videoPath) {
                var title = document.createElement("div");
                title.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";
                title.innerHTML = videoPath;
                container.appendChild(title);
                curProgess = document.createElement("div");
                curProgess.style.width = "100%";
                curProgess.style.height = "30px";
                container.appendChild(curProgess);
                curStep = null;
                CACHE["curVideo"] = videoPath;
                CACHE["curProgress"] = curProgess;
            }
            if (curProgess) {
                if (!curStep || curStep.matchType !== frameMatch) {
                    curStep = document.createElement("div");
                    curStep.style.display = "inline-block";
                    curStep.style.height = "30px";
                    curStep.style.background = frameMatch ? "#1DB100" : "#BE0000";
                    curStep.matchType = frameMatch;
                    curStep.numFrames = 0;
                    curProgess.appendChild(curStep);
                    CACHE["curStep"] = curStep;
                }
                ++curStep.numFrames;
                curStep.style.width = (100.0 / frameCount * curStep.numFrames) + "%";
            }
        }
    } else {
        CACHE["div"] = null;
        CACHE["curVideo"] = null;
        CACHE["curProgress"] = null;
        CACHE["curStep"] = null;
    }
}
