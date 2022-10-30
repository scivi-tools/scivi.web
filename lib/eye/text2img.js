
//size of pixel in bytes
const pixel_sizeof = 4;

//draws text at canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight)
{
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) 
    {
        var words = lines[i].split(" ");
        var line = "";

        for (var n = 0; n < words.length; n++) 
        {
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

function isEmpty(pixels, pixel_offset)
{
    return pixels[pixel_offset + 0] === 0xFF && 
            pixels[pixel_offset + 1] === 0xFF && 
            pixels[pixel_offset + 2] === 0xFF;
}

/**
 * Returns true if horizontal line is empty, false otherwise
 */
function emptyH(pixels, pixel_line_index, width)
{
    var pixel_offset = pixel_line_index * width * pixel_sizeof;
    for (var i = 0; i < width; ++i) {
        if (!isEmpty(pixels, pixel_offset))
            return false;
        pixel_offset += pixel_sizeof;
    }
    return true;
}

/**
 * Returns true if vertical line is empty, false otherwise
 */
function emptyV(pixels, pixel_column_index, start_pos, end_pos, width)
{
    for (var i = start_pos; i < end_pos; ++i) {
        var pixel_offset = (i * width + pixel_column_index) * pixel_sizeof;
        if (!isEmpty(pixels, pixel_offset))
            return false;
    }
    return true;
}

function threshold(fs){    return Math.floor(fs / 3); }

function segmentWords(pixels, width, height, font_size, text)
{
    var lines = [];
    var inside = false;
    var th = threshold(font_size);
    for (var i = 0; i < height; ++i) 
    {
        if (emptyH(pixels, i, width)) 
        {
            if (th === 0 && inside) {
                lines.push(i);
                inside = false;
            }
        } else {
            if (th > 0)
                --th;
            if (!inside) {
                lines.push(i);
                inside = true;
                th = threshold(font_size);
            }
        }
    }

    //---------------------- Create AOIs ---------------------
    words = text.trim().replace(/[.,\/#!?$%\^&\*;:{}=`~()\r]/g, "").
                        replace(/[\s{2,}\n]/g, " ").split(' ');
    var result = [];
    var wordStart = 0;
    var wordEnd = 0;
    var wordIndex = 0;
    inside = false;
    th = 0;
    for (var i = 0; i < lines.length; i += 2) 
    {
        for (var j = 0; j < width; ++j) 
        {
            if (emptyV(pixels, j, lines[i], lines[i + 1], width)) {
                if (wordEnd === -1)
                    wordEnd = j;
                if (th > 0)
                    --th;
                if (th === 0 && inside) {
                    result.push({ name: words[wordIndex++],
                                  bbox: [ wordStart, lines[i], wordEnd, lines[i + 1] ],
                                  path: [ [wordStart, lines[i]],
                                          [wordEnd, lines[i]],
                                          [wordEnd, lines[i + 1]],
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
                wordEnd = -1;
                th = threshold(font_size);
            }
        }
    }

    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["txt"]) 
    {
        let txt = SETTINGS_VAL["Text Paragraph"];
        let width = SETTINGS_VAL["Width"];
        let height = SETTINGS_VAL["Height"];
        let font_size = SETTINGS_VAL["Font size"];
        let margin = SETTINGS_VAL["Margin"];

        var cvs = document.createElement("canvas");
        cvs.width = width;
        cvs.height = height;
        var ctx = cvs.getContext("2d");
        ctx.font = font_size + "px Consolas,monaco,monospace";
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#000";
        wrapText(ctx, txt, margin, font_size, width - 2 * margin, font_size);
        CACHE["txt"] = { img: cvs.toDataURL(), aois: segmentWords(ctx.getImageData(0, 0, width, height).data, width, height, font_size, txt) };
    }
    OUTPUT["Picture"] = CACHE["txt"].img;
    OUTPUT["AOIs"] = CACHE["txt"].aois;
} else {
    CACHE["txt"] = null;
}
