
function wrapText(ctx, text, x, y, maxWidth, lineHeight)
{
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {

        var words = lines[i].split(" ");
        var line = "";

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

/**
 * Returns true if horizontal line is empty, false otherwise
 */
function emptyH(pixels, y, w)
{
    var p = y * w * 4;
    for (var i = 0; i < w; ++i) {
        if (pixels[p + 0] != 0xFF || pixels[p + 1] != 0xFF || pixels[p + 2] != 0xFF)
            return false;
        p += 4;
    }
    return true;
}

/**
 * Returns true if vertical line is empty, false otherwise
 */
function emptyV(pixels, x, sy, ey, w)
{
    for (var i = sy; i < ey; ++i) {
        var p = (i * w + x) * 4;
        if (pixels[p + 0] != 0xFF || pixels[p + 1] != 0xFF || pixels[p + 2] != 0xFF)
            return false;
    }
    return true;
}

function segmentWords(pixels, w, h, text)
{
    var lines = [];
    var inside = false;
    for (var i = 0; i < h; ++i) {
        if (emptyH(pixels, i, w)) {
            if (inside) {
                lines.push(i);
                inside = false;
            }
        } else {
            if (!inside) {
                lines.push(i);
                inside = true;
            }
        }
    }

    var words = text.split(" ");
    var result = [];
    var wordStart = 0;
    var w = 0;
    inside = false;
    for (var i = 0; i < lines.length; i += 2) {
        for (var j = 0; j < w; ++j) {
            if (emptyV(pixels, j, lines[i], lines[i + 1], w)) {
                if (inside) {
                    result.push({ name: words[w++],
                                  path: [ [wordStart, lines[i]],
                                          [j, lines[i]],
                                          [j, lines[i + 1]],
                                          [wordStart, lines[i + 1]] 
                                        ]
                                });
                    inside = false;
                }
            } else {
                if (!inside) {
                    wordStart = j;
                    inside = true;
                }
            }
        }
    }

    console.log(result);

    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["txt"]) {
        var txt = SETTINGS_VAL["Text Paragraph"];
        var w = SETTINGS_VAL["Width"];
        var h = SETTINGS_VAL["Height"];
        var fs = SETTINGS_VAL["Font size"];
        var cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext("2d");
        ctx.font = fs + "px Consolas,monaco,monospace";
        ctx.fillStyle = "#000";
        wrapText(ctx, txt, 0, fs, w, fs);
        CACHE["txt"] = { img: cvs.toDataURL(), aois: segmentWords(ctx.getImageData(0, 0, w, h).data, w, h, txt) };
    }
    OUTPUT["Picture"] = CACHE["txt"].img;
    OUTPUT["AOIs"] = CACHE["txt"].aois;
} else {
    CACHE["txt"] = null;
}