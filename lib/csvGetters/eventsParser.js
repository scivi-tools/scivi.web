if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];
    var nodes = [];
    var scale = null;
    for (var i = 1, n = table.length; i < n; ++i) {
        nodes.push({
            id: i,
            label: table[i][0],
            metadata: "<div>" + table[i][1] + "</div>",
            date: new Date(table[i][2]),
            weight: 0
        });
    }
    if (nodes.length > 0) {
        var colors = [
            0xdd1111,
            0x5dc8cd
        ];
        var textColors = [
            0xffffff,
            0x000000
        ];
        var steps = [ new Date(nodes[0].date.getFullYear(), nodes[0].date.getMonth()) ];
        var names = [ "" ];
        for (var i = 1, n = nodes.length; i < n; ++i) {
            if (nodes[i].date.getMonth() !== steps[steps.length - 1].getMonth() || nodes[i].date.getYear() !== steps[steps.length - 1].getYear())
                steps.push(new Date(nodes[i].date.getFullYear(), nodes[i].date.getMonth()));
        }
        for (var i = 0, n = steps.length; i < n; ++i) {
            names.push(steps[i].toLocaleString("default", { month: "long" }) + " " + steps[i].getFullYear());
        }
        names.push("");
        if (steps.length % 2 !== 0) {
            colors.push(0xfeae00);
            textColors.push(0x000000);
        }
        scale = {
            steps: steps,
            colors: colors,
            textColors: textColors,
            names: names,
            fn: function (node) { return node.date; }
        };
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: [] };
    OUTPUT["Ring Scale"] = [ scale ];
}
