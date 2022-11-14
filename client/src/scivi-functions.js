
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
