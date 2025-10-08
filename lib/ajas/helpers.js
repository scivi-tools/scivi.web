
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
        cvs.width = cvs.clientWidth * cs;
        cvs.height = cvs.clientHeight * cs;
        chart.renderOn2DCanvas(JSON.stringify(config), canvasID, 0, 0, cvs.clientWidth, cvs.clientHeight);
    },

    calcChartWidth: (numChartsInRow, numOthersInRow, restInRow) =>
    {
        const winPadding = 150 + 10 + 2 + 10 + 2; // actual window padding + dashbox padding left + border + dashbox padding right + border
        const interPadding = 10 + 2 + 20 + 10 + 2; // dashbox padding left + border + gap + dashbox padding right + border
        return Math.floor((window.innerWidth - winPadding -
                           interPadding * (numChartsInRow + numOthersInRow - 1) -
                           restInRow) / numChartsInRow);
    },

    histogramTemplate: (config) =>
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
                        "settingsVal": { "Config": config },
                        "settingsType": { "Config": "JSON" },
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
    }
};
