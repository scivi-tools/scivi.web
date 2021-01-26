
if (IN_VISUALIZATION) {
    if (HAS_INPUT["EEG"]) {
        var grid = INPUT["EEG"];
        if (grid) {
            var charts = CACHE["charts"];
            var n = grid.length;
            if (charts) {
                for (var i = 0; i < n; ++i) {
                    for (var j = 0, m = 1/*grid[i].length*/; j < m; ++j) {
                        charts[i].data.datasets[0].data.push({
                            x: Date.now(),
                            y: grid[i][j]
                        });
                    }
                    charts[i].update({
                        preservation: true
                    });
                }
            } else {
                charts = [];
                var div = document.createElement("div");
                for (var i = 0; i < n; ++i) {
                    var subDiv = document.createElement("div");
                    subDiv.style.height = "200px";
                    var cvs = document.createElement("canvas");
                    var ctx = cvs.getContext("2d");
                    var data = [];
                    for (var j = 0, m = 1/*grid[i].length*/; j < m; ++j) {
                        data.push({
                            x: Date.now(),
                            y: grid[i][j]
                        });
                    }
                    var chart = new Chart(ctx, {
                        type: "line",
                        data: {
                            datasets: [{
                                label: "channel " + i,
                                borderColor: "#000",
                                fill: false,
                                lineTension: 0,
                                data: data
                            }]
                        },
                        options: {
                            animation: {
                                duration: 0
                            },
                            hover: {
                                animationDuration: 0
                            },
                            responsiveAnimationDuration: 0,
                            maintainAspectRatio: false,
                            plugins: {
                                streaming: {
                                    frameRate: 0
                                }
                            },
                            // scales: {
                            //     xAxes: [{
                            //         type: "realtime"
                            //     }]
                            // }
                            scales: {
                                xAxes: [{
                                    type: 'realtime',
                                    realtime: {
                                        duration: 20000,
                                        delay: 2000,
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'value'
                                    }
                                }]
                            },
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
