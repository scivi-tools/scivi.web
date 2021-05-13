
if (IN_VISUALIZATION) {
    var barChart = CACHE["bar"];
    if (!barChart) {
        var cvs = document.createElement("canvas");
        var ctx = cvs.getContext("2d");
        var data = {};
        barChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                scales : {
                    yAxes : [{
                        ticks : {
                            beginAtZero : true
                        }
                    }]
                }
            }
        });
        CACHE["bar"] = barChart;
        CACHE["barData"] = data;
        ADD_VISUAL(cvs);
    }
    var colors = [
        "#F2645A", "#1DAAB2", "#F5B455", "#88D9F2", "#C0A141",
        "#AE79F3", "#C4CD5C", "#3C5FD6", "#86C558", "#B94296",
        "#809549", "#5693D6", "#2DAA31", "#C569CD", "#54B075",
        "#9F5A8F", "#2D8764", "#ADADE9", "#65B1A1", "#A030CB"
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
            data: data[i].slice(1, n),
            minBarLength: 10,
        });
    }
    barChart.update();
} else {
    CACHE["bar"] = null;
    CACHE["barData"] = null;
}
