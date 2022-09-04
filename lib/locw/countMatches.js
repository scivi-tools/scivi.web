function inputValid(inp)
{
    return inp !== null && inp !== undefined;
}

function getInput(inp, name)
{
    if (inputValid(inp))
        CACHE[name] = inp;
    else
        inp = CACHE[name];
    return inp;
}

if (HAS_INPUT["Frame Match"] && HAS_INPUT["Frame Index"] && HAS_INPUT["Frame Count"] && HAS_INPUT["Video Path"] && HAS_INPUT["Frame Path"]) {
    if (IN_VISUALIZATION) {
        var frameMatch = getInput(INPUT["Frame Match"], "frameMatch");
        var frameIndex = getInput(INPUT["Frame Index"], "frameIndex");
        var frameCount = getInput(INPUT["Frame Count"], "frameCount");
        var videoPath = getInput(INPUT["Video Path"], "videoPath");
        var framePath = getInput(INPUT["Frame Path"], "framePath");
        if (inputValid(frameMatch) && inputValid(frameIndex) && inputValid(frameCount) && inputValid(videoPath) && inputValid(framePath)) {
            var container = CACHE["div"];
            if (!container) {
                container = document.createElement("div");
                container.style.width = "100%";
                container.style.padding = "10px";
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
        CACHE["frameMatch"] = null;
        CACHE["frameIndex"] = null;
        CACHE["frameCount"] = null;
        CACHE["videoPath"] = null;
        CACHE["framePath"] = null;

        CACHE["div"] = null;
        CACHE["curVideo"] = null;
        CACHE["curProgress"] = null;
        CACHE["curStep"] = null;
    }
}
