
function dataGen()
{
    return (Math.random() < 0.5 ? -1 : 1) * Math.random();
}
if (HAS_INPUT["EEG Data"] && INPUT["EEG Data"]) {
    if (IN_VISUALIZATION) {
        var g_eegChart = CACHE["eegChart"];
        if (!g_eegChart) {
            var div = document.createElement("div");
            var navbarDiv = document.createElement("div");
            navbarDiv.classList.add('navbar');
            var navbarButtonChannels = document.createElement("button");
            navbarButtonChannels.textContent = 'Channels';
            navbarButtonChannels.classList.add('dropbtn');
            var navbarListDiv = document.createElement("div");
            navbarListDiv.id = 'navbar-list';
            navbarListDiv.classList.add('dropdown-content');
            var dropdownDiv = document.createElement("div");
            dropdownDiv.classList.add('dropdown');
            dropdownDiv.appendChild(navbarButtonChannels);
            dropdownDiv.appendChild(navbarListDiv);
            navbarDiv.appendChild(dropdownDiv);
            var eegChartDiv = document.createElement("div");
            eegChartDiv.id = 'chart-test';
            eegChartDiv.classList.add('scrl');
            div.appendChild(navbarDiv);
            div.appendChild(eegChartDiv);
            div.style.marginTop = "50px";
            div.style.height = "90%";
            div.style.width = "100%";
            eegChartDiv.style.height = window.innerHeight + "px";
            eegChartDiv.style.width = window.innerWidth + "px";
            eegChartDiv.clientWidth = window.innerWidth;
            eegChartDiv.clientHeight = window.innerHeight;

            var data = {};

            g_eegChart = new EEGChart.EEGChart(eegChartDiv, navbarListDiv);
            CACHE["eegChart"] = g_eegChart;
            CACHE["eegData"] = data;
            ADD_VISUAL(div);
        }

        var eegData = CACHE["eegData"];
        var data = INPUT["EEG Data"];
        //var dwqe = data.channels[0].samples[0];

        g_eegChart.render();
        (data.channels).forEach((channel, index) => {
            if (index != 20) {
                g_eegChart.appendChannelData(channel.label, channel.samples);
                g_eegChart.render();
            }

        });
        // setInterval(function () {
        //     g_eegChart.appendChannelData("1", [ dataGen() ]);
        //     g_eegChart.appendChannelData("2", [ dataGen() ]);
        //     g_eegChart.appendChannelData("3", [ dataGen() ]);
        //     g_eegChart.appendChannelData("4", [ dataGen() ]);
        //     g_eegChart.appendChannelData("5", [ dataGen() ]);
        //     g_eegChart.appendChannelData("6", [ dataGen() ]);
        //     g_eegChart.appendChannelData("7", [ dataGen() ]);
        //     g_eegChart.appendChannelData("8", [ dataGen() ]);
        //     g_eegChart.appendChannelData("9", [ dataGen() ]);
        //     g_eegChart.appendChannelData("10", [ dataGen() ]);
        //     g_eegChart.appendChannelData("11", [ dataGen() ]);
        //     g_eegChart.appendChannelData("12", [ dataGen() ]);
        //     g_eegChart.appendChannelData("13", [ dataGen() ]);
        //     g_eegChart.appendChannelData("14", [ dataGen() ]);
        //     g_eegChart.appendChannelData("15", [ dataGen() ]);
        //     g_eegChart.appendChannelData("16", [ dataGen() ]);
        //     g_eegChart.appendChannelData("17", [ dataGen() ]);
        //     g_eegChart.appendChannelData("18", [ dataGen() ]);
        //     g_eegChart.render();
        // }, 10);


        // barData.labels = data[0].slice(1, data[0].length);
        // barData.datasets = [];
        // for (var i = 1, n = data.length; i < n; ++i)
        // {
        //     barData.datasets.push({
        //         label: data[i][0],
        //         backgroundColor: colors[(i - 1) % colors.length],
        //         data: data[i].slice(1, n),
        //         minBarLength: 10,
        //     });
        // }
        // barChart.update();
    } else {
        CACHE["eegChart"] = null;
        CACHE["eegData"] = null;
    }
}
