/**
 * helpers.js
 *
 * Part of the ARI/ZAH Layered Online Reduction Inspection System (LORIS).
 *
 * @author Konstantin Riabinin (konstantin.riabinin@uni-heidelberg.de)
 *
 * This script is a set of helper methods for client-side workers.
 */

/**
 * The ReportHelpers provides helper methods of LORIS.
 */
var ReportHelpers = {
    /**
     * Place a chart in HTML.
     *
     * @param canvasID - 2D canvas ID for a chart. Absolutely has to be unique.
     * @param width - width of the chart.
     * @param height - height of the chart.
     * @return HTML for a chart.
     */
    placeChart: (canvasID, width, height) =>
    {
        return `
            <div onclick="NChart3DLib.chart.${canvasID}();" class="report-chart-container">
                <div id="${canvasID}Spinner" class="report-spinner">
                    <div class="report-spinner-circle"></div>
                </div>
                <canvas id="${canvasID}" style="width: ${width}px; height: ${height}px;"></canvas>
            </div>
        `;
    },

    /**
     * Create a chart.
     *
     * @param func - setup function to call with the newly created chart.
     */
    createChart: async (func) =>
    {
        if (!NChart3DLib.chart)
        {
            const mdl = await NChart3DLib();
            NChart3DLib.chart = new mdl.NChart();
            NChart3DLib.chart.didLoad = (chart, canvasID) => {
                const elem = document.getElementById(`${canvasID}Spinner`);
                if (elem != null)
                    elem.style.display = "none";
            };
        }
        func(NChart3DLib.chart);
    },

    /**
     * Render a static chart on a canvas.
     *
     * @param chart - chart object used to perform rendering.
     * @param config - configuration dictionary of the chart.
     * @param canvasID - 2D canvas ID where to render.
     */
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

    /**
     * Calculate width that the chart will have in the given row of elements, accounting for the sizes of other
     * elements populating this row, and for all the paddings.
     *
     * @param numChartsInRow - number of charts in a row on the screen.
     * @param numOthersInRow - number of other elements in this row on the screen.
     * @param restInRow - desired space reminder in this row.
     * @return width to assign for a chart.
     */
    calcChartWidth: (numChartsInRow, numOthersInRow, restInRow) =>
    {
        // actual window padding + dashbox padding left + border + dashbox padding right + border
        const winPadding = 140 + 10 + 1 + 10 + 1;
        // dashbox padding left + border + gap + dashbox padding right + border
        const interPadding = 10 + 1 + 10 + 10 + 1;
        return Math.floor((window.innerWidth - winPadding -
                           interPadding * (numChartsInRow + numOthersInRow - 1) -
                           restInRow) / numChartsInRow);
    },

    /**
     * Create a SciVi template for a histogram chart visual object.
     *
     * @param config - chart config.
     * @param solutionID - solution ID.
     * @return SciVi template as a dictionary.
     */
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

    /**
     * Create a SciVi template for a scatter chart visual object.
     *
     * @param config - chart config.
     * @param isJORS - flag, determining of the chart is in JORS (true) or GRS (false).
     * @param solutionID - solution ID.
     * @return SciVi template as a dictionary.
     */
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

    /**
     * Create a SciVi template for a heatmap chart visual object.
     *
     * @param config - chart config.
     * @param solutionID - solution ID.
     * @return SciVi template as a dictionary.
     */
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

    /**
     * Create a SciVi template for a low-order calibration chart visual object.
     *
     * @param config - chart config.
     * @param tsURL - URL to the file with timestamps.
     * @param solutionID - solution ID.
     * @return SciVi template as a dictionary.
     */
    loCalibMonTemplate: (config, tsURL, solutionID) =>
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
                        "settingsVal":
                        {
                            "Config": config,
                            "TSURL": tsURL,
                            "Solution": solutionID
                        },
                        "settingsType":
                        {
                            "Config": "JSON",
                            "TSURL": "String",
                            "Solution": "String"
                        },
                        "settingsChanged": {}
                    },
                    "group": null,
                    "inputs": [],
                    "outputs": [],
                    "position": [ 0.0, 0.0 ],
                    "title": "LO Calib Monitor"
                }
            },
            "groups": {}
        };
    },

    /**
     * Enrich the chart config for an interactive chart.
     *
     * @param config - chart config.
     */
    enrichConfig: (config) =>
    {
        if (config.legend === undefined)
            config.legend = {};
        config.legend.toggleSeriesByClick = true;
        for (let i = 0, n = config.series.length; i < n; ++i)
            config.series[i].disabledNameColor = "#D5D5D5";
        config.hoverEnabled = true;
        config.zoomToPointMode = true;
    }
};
