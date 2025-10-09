
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

SciViFunctions.forkWithTemplate = function(template)
{
    if (window.sciviStorage === undefined)
        window.sciviStorage = [];
    let forkTemplate = window.sciviStorage.length;
    if (forkTemplate === 5)
        forkTemplate = 0;
    window.sciviStorage[forkTemplate] = JSON.stringify(template);
    window.open(`${window.location.pathname}?forktemplate=${forkTemplate}&start=true`);
}
