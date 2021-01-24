
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
    var barData = CACHE["barData"];
    barData.labels = INPUT["Bar Data"][0];
    barData.datasets = [{
        label: SETTINGS_VAL["Bar Name"],
        backgroundColor: SETTINGS_VAL["Bar Color"],
        data: INPUT["Bar Data"][1]
    }];
    barChart.update();
} else {
    CACHE["bar"] = null;
    CACHE["barData"] = null;
}
