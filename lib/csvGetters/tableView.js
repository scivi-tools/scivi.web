if (IN_VISUALIZATION && HAS_INPUT["Table"] && INPUT["Table"]) {
    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";
    container.style.textAlign = "center";
    container.style.overflow = "auto";
    container.style.display = "grid";

    var table = INPUT["Table"];
    var content = "";
    if (table) {
        content += "<tr>";
        content += "<th style='border: 1px solid black; border-collapse: collapse;'>#</th>";
        for (var i = 0, n = table[0].length; i < n; ++i)
            content += "<th style='border: 1px solid black; border-collapse: collapse;'>" + table[0][i] + "</th>";
        content += "</tr>";
        for (var i = 1, n = table.length; i < n; ++i) {
            var color = i % 2 === 0 ? "#fff" : "#eef";
            content += "<tr style='background: " + color + "'>";
            content += "<td style='border: 1px solid black; border-collapse: collapse;'>" + i + "</td>";
            for (var j = 0, m = table[i].length; j < m; ++j)
                content += "<td style='border: 1px solid black; border-collapse: collapse;'>" + table[i][j] + "</td>";
            content += "</tr>";
        }
    }

    var tableDiv = document.createElement("table");
    tableDiv.style.border = "1px solid black";
    tableDiv.style.borderCollapse = "collapse";

    tableDiv.innerHTML = content;
    container.appendChild(tableDiv);

    ADD_VISUAL(container);
}
