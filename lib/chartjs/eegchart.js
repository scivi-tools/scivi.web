
if (IN_VISUALIZATION) {
    if (HAS_INPUT["EEG"]) {
      var grid = INPUT["EEG"];
        if (grid) {
            var charts = CACHE["charts"];
            var history_length = SETTINGS_VAL["History"];
            var channel_count = grid.length;
            var sample_count = grid[0].length;
            if (charts) {
                for (var i = 0; i < channel_count; ++i) {
                    var data = charts[i].data.datasets[0].data;
                    for (var j = sample_count; j < history_length; ++j)
                        data[j - sample_count] = data[j];
                    for (var j = history_length - sample_count; j < history_length; ++j)
                        data[j] = grid[i][j - history_length + sample_count];
                    charts[i].update();
                }
            } else {
                charts = [];
                var div = document.createElement("div");
                for (var i = 0; i < channel_count; ++i) {
                    var subDiv = document.createElement("div");
                    subDiv.style.height = (window.innerHeight / channel_count) + "px";
                    var cvs = document.createElement("canvas");
                    var ctx = cvs.getContext("2d");
                    var data = [];
                    var labels = [];
                    for (var j = 0; j < history_length; ++j) {
                        if (j < sample_count) {
                            data.push({ y: grid[i][j] });
                        } else {
                            data.push({ y: 0 });
                        }
                        labels.push(j);
                    }
                    channel_name = "channel " + i;
                    if (HAS_INPUT["Labels"]) {
                        channel_name = INPUT["Labels"][i];
                    }
                    var chart = new Chart(ctx, {
                        type: "line",
                        data: {
                            labels: labels,
                            datasets: [{
                                label: channel_name,
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
