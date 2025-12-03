
var ReportHelpers = {
    createChart: async (func) =>
    {
        if (!NChart3DLib.chart)
        {
            const mdl = await NChart3DLib();
            NChart3DLib.chart = new mdl.NChart();
        }
        func(NChart3DLib.chart);
    },

    renderChart: (chart, config, canvasID) =>
    {
        const cvs = document.getElementById(canvasID);
        const cs = window.devicePixelRatio;
        const w = parseInt(cvs.style.width, 10);
        const h = parseInt(cvs.style.height, 10);
        cvs.width = w * cs;
        cvs.height = h * cs;
        chart.renderOn2DCanvas(JSON.stringify(config), canvasID, 0, 0, w, h);
    },

    calcChartWidth: (numChartsInRow, numOthersInRow, restInRow) =>
    {
        const winPadding = 140 + 10 + 1 + 10 + 1; // actual window padding + dashbox padding left + border + dashbox padding right + border
        const interPadding = 10 + 1 + 10 + 10 + 1; // dashbox padding left + border + gap + dashbox padding right + border
        return Math.floor((window.innerWidth - winPadding -
                           interPadding * (numChartsInRow + numOthersInRow - 1) -
                           restInRow) / numChartsInRow);
    },

    histogramTemplate: (config, solutionID) =>
    {
        return {
            "id": "SciViNodeEditor@0.1.0",
            "nodes":
            {
                "1":
                {
                    "id": 1,
                    "data":
                    {
                        "settings": {},
                        "settingsVal": { "Config": config, "Solution": solutionID },
                        "settingsType": { "Config": "JSON", "Solution": "String" },
                        "settingsChanged": {}
                    },
                    "group": null,
                    "inputs": [],
                    "outputs": [],
                    "position": [ 0.0, 0.0 ],
                    "title": "Histogram"
                }
            },
            "groups": {}
        };
    },

    scatterTemplate: (config, isJORS, solutionID) =>
    {
        return {
            "id": "SciViNodeEditor@0.1.0",
            "nodes":
            {
                "1":
                {
                    "id": 1,
                    "data":
                    {
                        "settings": {},
                        "settingsVal": { "Config": config, "Solution": solutionID, "JORS": isJORS },
                        "settingsType": { "Config": "JSON", "Solution": "String", "JORS": "Bool" },
                        "settingsChanged": {}
                    },
                    "group": null,
                    "inputs": [],
                    "outputs": [],
                    "position": [ 0.0, 0.0 ],
                    "title": "Scatter"
                }
            },
            "groups": {}
        };
    },

    heatmapTemplate: (config, solutionID) =>
    {
        return {
            "id": "SciViNodeEditor@0.1.0",
            "nodes":
            {
                "1":
                {
                    "id": 1,
                    "data":
                    {
                        "settings": {},
                        "settingsVal": { "Config": config, "Solution": solutionID },
                        "settingsType": { "Config": "JSON", "Solution": "String" },
                        "settingsChanged": {}
                    },
                    "group": null,
                    "inputs": [],
                    "outputs": [],
                    "position": [ 0.0, 0.0 ],
                    "title": "Heatmap"
                }
            },
            "groups": {}
        };
    },

    enrichConfig: (config) =>
    {
        if (config.legend === undefined)
            config.legend = {};
        config.legend.seriesClicked = "NChart3DLib.chart.toggleSeries";
        for (let i = 0, n = config.series.length; i < n; ++i)
            config.series[i].disabledNameColor = "#D5D5D5";
        config.hoverEnabled = true;
        config.zoomToPointMode = true;
    }
};
