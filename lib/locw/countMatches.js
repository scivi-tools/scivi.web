const TT_WIDTH = 800;
const TT_HEIGHT = TT_WIDTH * (720.0 / 1280.0)

function inputValid(inp)
{
    return inp !== null && inp !== undefined;
}

function showPopup(x, y, imgPath)
{
    const minLeft = 0;
    const maxLeft = CACHE["div"].getBoundingClientRect().right - TT_WIDTH - 10;
    var left = x - TT_WIDTH / 2.0;
    var aLeft = TT_WIDTH / 2.0 - 15;
    if (left < minLeft) {
        left = minLeft;
        aLeft = x - left - 15 - 5 - 2;
    } else if (left > maxLeft) {
        left = maxLeft;
        aLeft = x - left - 15 - 5 - 2;
    }
    var tooltip = CACHE["tooltip"];
    tooltip.style.left = left + "px";
    tooltip.style.top = y + "px";
    tooltip.style.display = "block";
    CACHE["arrow1"].style.left = CACHE["arrow2"].style.left = aLeft + "px";
    CACHE["img"].src = "storage/" + imgPath + ".jpg";
}

function  hidePopup()
{
    CACHE["tooltip"].style.display = "none";
    CACHE["img"].src = "";
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
                container.style.width = "calc(100% - 40px)";
                container.style.height = "100%";
                container.style.marginLeft = container.style.marginRight = "20px";
                container.style.marginTop = "60px";
                container.addEventListener("click", (e) => {
                    hidePopup();
                });
                CACHE["div"] = container;
                ADD_VISUAL(container);
            }
            if (!CACHE["tooltip"]) {
                var tooltip = document.createElement("div");
                tooltip.style.display = "none";
                tooltip.style.position = "absolute";
                tooltip.style.width = TT_WIDTH + "px";
                tooltip.style.height = TT_HEIGHT + "px";
                tooltip.style.border = "2px solid grey";
                tooltip.style.borderRadius = "10px";
                tooltip.style.padding = "5px";
                tooltip.style.background = "white";
                var arrow1 = document.createElement("div");
                arrow1.style.position = "relative";
                arrow1.style.display = "block";
                arrow1.style.marginBottom = "-30px";
                // arrow1.style.left = "calc(50% - 15px)";
                arrow1.style.top = "-35px";
                arrow1.style.width = "0px";
                arrow1.style.height = "0px";
                arrow1.style.borderLeft = "15px solid transparent";
                arrow1.style.borderRight = "15px solid transparent";
                arrow1.style.borderBottom = "30px solid grey";
                tooltip.appendChild(arrow1);
                var imgHolder = document.createElement("div");
                imgHolder.style.width = TT_WIDTH + "px";
                imgHolder.style.height = TT_HEIGHT + "px";
                imgHolder.style.textAlign = "center";
                tooltip.appendChild(imgHolder);
                var arrow2 = document.createElement("div");
                arrow2.style.position = "relative";
                arrow2.style.display = "block";
                arrow2.style.marginBottom = "-30px";
                // arrow2.style.left = "calc(50% - 15px)";
                arrow2.style.bottom = "calc(100% + 30px)";
                arrow2.style.width = "0px";
                arrow2.style.height = "0px";
                arrow2.style.borderLeft = "15px solid transparent";
                arrow2.style.borderRight = "15px solid transparent";
                arrow2.style.borderBottom = "30px solid white";
                tooltip.appendChild(arrow2);
                var img = document.createElement("img");
                img.style.height = "100%";
                imgHolder.appendChild(img);
                container.appendChild(tooltip);
                CACHE["tooltip"] = tooltip;
                CACHE["img"] = img;
                CACHE["arrow1"] = arrow1;
                CACHE["arrow2"] = arrow2;
            }
            var curVideo = CACHE["curVideo"];
            var curProgess = CACHE["curProgress"];
            var curStep = CACHE["curStep"];
            if (curVideo !== videoPath) {
                var title = document.createElement("div");
                title.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";
                title.style.fontWeight = "bold";
                title.innerHTML = videoPath;
                container.appendChild(title);
                curProgess = document.createElement("div");
                curProgess.style.width = "100%";
                curProgess.style.height = "30px";
                curProgess.frames = [];
                curProgess.frameCount = frameCount;
                curProgess.addEventListener("click", (e) => {
                    var x = e.clientX - 20;
                    var w = curProgess.clientWidth;
                    var i = Math.round(x / w * curProgess.frameCount);
                    if (i < curProgess.frames.length) {
                        showPopup(e.clientX, curProgess.getBoundingClientRect().top + 45, curProgess.frames[i]);
                        e.stopPropagation();
                    }
                });
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
                curProgess.frames.push(framePath);
                ++curStep.numFrames;
                curStep.style.width = (100.0 / frameCount * curStep.numFrames) + "%";
            }
        }
    } else {
        CACHE["div"] = null;
        CACHE["curVideo"] = null;
        CACHE["curProgress"] = null;
        CACHE["curStep"] = null;
        CACHE["tooltip"] = null;
        CACHE["img"] = null;
        CACHE["arrow1"] = null;
        CACHE["arrow2"] = null;
    }
}
