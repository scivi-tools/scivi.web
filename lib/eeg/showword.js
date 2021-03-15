if (IN_VISUALIZATION && HAS_INPUT["Word"]) {
    var wordDiv = CACHE["WordDiv"];
    if (!wordDiv) {
        var pdiv = document.createElement("div");
        pdiv.style = "width: 100%; height: 100%; background: #BEBEBE;";
        var div = document.createElement("div");
        div.style = "width: 100%; height: 100%; background: #272821;";
        wordDiv = document.createElement("div");
        wordDiv.style = "position: absolute; top: 50%; left: 0; right: 0; margin: auto; text-align: center; font: 36px Helvetica Neue, Helvetica, Arial, sans-serif; -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); transform: translateY(-50%); color: #e6e6e6;";
        pdiv.appendChild(div);
        div.appendChild(wordDiv);
        ADD_VISUAL(pdiv);
        wordDiv = $(wordDiv);
        CACHE["WordDiv"] = wordDiv;
        CACHE["Back"] = $(div);
    }
    var iter = INPUT["Iteration"];
    if (iter > 0) {
        var word = INPUT["Word"];
        if (word) {
            wordDiv.html(word);
            wordDiv.fadeIn(SETTINGS_VAL["Fade Time"]);
        } else {
            wordDiv.fadeOut(SETTINGS_VAL["Fade Time"]);
        }
    } else {
        wordDiv.fadeOut(SETTINGS_VAL["Fade Time"]);
        CACHE["Back"].fadeOut(SETTINGS_VAL["Fade Time"] * 2);
    }
} else {
    CACHE["WordDiv"] = null;
    CACHE["Back"] = null;
}
