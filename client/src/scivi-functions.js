
module.exports = SciViFunctions;

function SciViFunctions()
{
}

SciViFunctions.nonNull = function()
{
    for (var i = 0, n = arguments.length; i < n; ++i) {
        if (arguments[i] === undefined || arguments[i] === null)
            return false;
    }
    return true;
}

SciViFunctions.deepCopy = function(obj)
{
    return JSON.parse(JSON.stringify(obj))
}

SciViFunctions.runTemplate = function(template)
{
    if (window.sciviStorage === undefined)
        window.sciviStorage = [];
    let rtTemplate = window.sciviStorage.length;
    if (rtTemplate === 5)
        rtTemplate = 0;
    window.sciviStorage[rtTemplate] = JSON.stringify(template);
    window.open(`${window.location.pathname}?rttemplate=${rtTemplate}&start=true`);
}
