
if (IN_VISUALIZATION) {
    if (HAS_INPUT["EEG"]) {
        var grid = INPUT["EEG"];
        if (grid) {
            var charts = CACHE["charts"];
            // var n = grid.length - 1;
            var m = grid.length - 1;
            var hL = 100;
            if (charts) {
                for (var i = 0; i < grid[0].length; ++i) {
                    // var elName = grid[0][i];
                    // var elVal = grid[1][i];
                    // var m = grid[i].length;
                    var data = charts[i].data.datasets[0].data;
                    for (var j = m; j < hL; ++j)
                        data[j - m] = data[j];
                    for (var j = hL - m; j < hL; ++j)
                        data[j] = grid[j - hL + m][i];
                    charts[i].update();
                }
                // for (var i = 0; i < n; ++i) {
                //     var m = grid[i].length;
                //     var data = charts[i].data.datasets[0].data;
                
                // }
            } else {
                charts = [];
                var div = document.createElement("div");
                for (var i = 0; i < n; ++i) {
                    var subDiv = document.createElement("div");
                    subDiv.style.height = (window.innerHeight / n) + "px";
                    var cvs = document.createElement("canvas");
                    var ctx = cvs.getContext("2d");
                    var data = [];
                    var labels = [];
                    for (var j = 0, m = grid[i].length; j < hL; ++j) {
                        data.push({
                            y: j < hL - m ? 0 : grid[i][j - hL + m]
                        });
                        labels.push(j);
                    }
                    var chart = new Chart(ctx, {
                        type: "line",
                        data: {
                            labels: labels,
                            datasets: [{
                                label: "channel " + i,
                                borderColor: "#000",
                                fill: false,
                                lineTension: 0,
                                data: data
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            tooltips: {
                                enabled: false
                            },
                            animation: false
                        }
                    });
                    subDiv.appendChild(cvs);
                    div.appendChild(subDiv);
                    charts.push(chart);
                }
                ADD_VISUAL(div);
                CACHE["charts"] = charts;
            }
        }
    }
} else {
    CACHE["charts"] = null;
}
