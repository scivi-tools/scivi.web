
if (IN_VISUALIZATION) {
    var barChart = CACHE["bar"];
    if (!barChart) {
        var cvs = document.createElement("canvas");
        var ctx = cvs.getContext("2d");
        var data = {};
        barChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {}
        });
        CACHE["bar"] = barChart;
        CACHE["barData"] = data;
        ADD_VISUAL(cvs);
    }
    var colors = [
        "#00aa00", "#0000aa", "#00aaaa", "#e6194b",
        "#3cb44b", "#0082c8", "#911eb4", "#46f0f0",
        "#f032e6", "#d2f53c", "#fabebe", "#008080",
        "#e6beff", "#aa6e28", "#fffac8", "#800000",
        "#aaffc3", "#808000", "#ffd8b1", "#000080",
        "#808080", "#ff0000", "#00ff00", "#0000ff",
        "#ff00ff", "#ffff00", "#00ffff"
    ];
    var barData = CACHE["barData"];
    var data = INPUT["Bar Data"];
    barData.labels = data[0].slice(1, data[0].length);
    barData.datasets = [];
    for (var i = 1, n = data.length; i < n; ++i)
    {
        barData.datasets.push({
            label: data[i][0],
            backgroundColor: colors[(i - 1) % colors.length],
            data: data[i].slice(1, n)
        });
    }
    barChart.update();
} else {
    CACHE["bar"] = null;
    CACHE["barData"] = null;
}
