function movAv(value, samples)
{
    var n = samples.arr.length;
    if (n < samples.n)
    {
        samples.arr.push(value);
        samples.ptr = n;
        n++;
    }
    else
    {
        if ((samples.b < samples.n / 4) && (Math.abs(samples.arr[samples.ptr] - value) > samples.rejTh))
            samples.b++;
        else
        {
            samples.b = 0;
            samples.ptr++;
            if (samples.ptr === samples.n)
                samples.ptr = 0;
            samples.arr[samples.ptr] = value;
        }
    }
    var av = 0;
    for (var i = 0; i < n; ++i)
        av += samples.arr[i];
    return av / n;
}

if (IN_VISUALIZATION && HAS_INPUT["Value"] && INPUT["Value"] !== undefined) {
    var samples = CACHE["samples"];
    if (!samples) {
        samples = { arr: [], ptr: 0, n: SETTINGS_VAL["History Length"], b: 0, rejTh: SETTINGS_VAL["Reject Threshold"] };
        CACHE["samples"] = samples;
    }
    OUTPUT["Smooth Value"] = movAv(INPUT["Value"], samples);
} else {
    CACHE["samples"] = null;
}
