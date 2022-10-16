const FIXATION_NAME = ["Первая", "Вторая", "Третья", "Четвёртая", "Пятная", "Шестая", "Седьмая", "Восьмая", "Девятая", "Десятая"];
const MAJORITY = ["Большинство информантов", "Большая часть информантов", "Наибольший процент информантов", "Наибольшее число информантов"];
const LOOK_AT = ["смотрят на", "обращают внимание на"];
const AV_FIX_TIME = ["при этом время среднее фиксации составляет около"];
// const SECOND_PLACE

function dumpCSV(csv)
{
    var result = "";
    for (var i = 0; i < csv.length; ++i)
        result += csv[i].join(";") + "\n";
    return result;
}

if (IN_VISUALIZATION && HAS_INPUT["Values"] && INPUT["Values"] && HAS_INPUT["AOIs"]) {
    var container = CACHE["container"];
    if (!container) {
        container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";
        container.style.margin = "24px 0px 0px 70px";
        CACHE["container"] = container;

        var dl = document.createElement("div");
        dl.innerHTML = "Download table";
        dl.classList.add("scivi_button");
        dl.addEventListener("click", e => {
            var table = CACHE["table"];
            if (table)
                SAVE_FILE(dumpCSV(table), "table.csv", ".csv", "text/plain;charset=utf-8", true);
        });
        container.appendChild(dl);

        ADD_VISUAL(container);
    }
    var values = INPUT["Values"];
    var aois = INPUT["AOIs"];
    var table = [ [ "№ фиксации", "Элементы по рейтингу", "Кол-во информантов, %", "Время фиксации, мс" ] ];
    var descr = "";
    for (var fixationNum = 0, n = Math.min(values.length, 10); fixationNum < n; ++fixationNum) {
        var fixation = values[fixationNum].splice(1, values[fixationNum].length);
        fixation.sort((a, b) => { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0; });
        var places = [];
        var prevVal = -1;
        var place = -1;
        var showFixation = true;
        var f = fixationNum + 1;
        var places = [[]];
        for (var i = 0; i < fixation.length; ++i) {
            var val = Math.round(fixation[i][1] * 100);
            // table.push([  f, aois[fixation[i][0]].name, val, Math.round(fixation[i][4] * 100) / 100 ]);
            if (val != prevVal) {
                prevVal = val;
                places.push([]);
                ++place;
            }
            places[place].push([  f, aois[fixation[i][0]].name, val, Math.round(fixation[i][4] * 100) / 100 ]);
            f = "";
            if (place == 2)
                break;
        }
        descr += FIXATION_NAME[fixationNum] + " фиксация.";
        for (var i = 0; i < places.length; ++i) {
            for (var j = 0; j < places[i].length; ++j) {
                if (j === 0)
                    table.push([ places[i][j][0], (i + 1) + ". " + places[i][j][1], places[i][j][2], places[i][j][3] ]);
                else
                    table.push([ places[i][j][0], places[i][j][1], places[i][j][2], places[i][j][3] ]);
            }
        }
    }
    OUTPUT["Table"] = table;
    CACHE["table"] = table;
} else {
    CACHE["container"] = undefined;
    CACHE["table"] = undefined;
}
