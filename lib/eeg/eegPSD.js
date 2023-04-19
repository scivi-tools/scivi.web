var kissFFTModule = KissFFTModule({});

var kiss_fftr_alloc = kissFFTModule.cwrap(
    'kiss_fftr_alloc', 'number', ['number', 'number', 'number', 'number' ]
);

var kiss_fftr = kissFFTModule.cwrap(
    'kiss_fftr', 'void', ['number', 'number', 'number' ]
);

var kiss_fftri = kissFFTModule.cwrap(
    'kiss_fftri', 'void', ['number', 'number', 'number' ]
);

var kiss_fftr_free = kissFFTModule.cwrap(
    'kiss_fftr_free', 'void', ['number']
);

var kiss_fft_alloc = kissFFTModule.cwrap(
    'kiss_fft_alloc', 'number', ['number', 'number', 'number', 'number' ]
);

var kiss_fft = kissFFTModule.cwrap(
    'kiss_fft', 'void', ['number', 'number', 'number' ]
);

var kiss_fft_free = kissFFTModule.cwrap(
    'kiss_fft_free', 'void', ['number']
);

var FFT = function (size) {

    this.size = size;
    this.fcfg = kiss_fft_alloc(size, false);
    this.icfg = kiss_fft_alloc(size, true);

    this.inptr = kissFFTModule._malloc(size*8 + size*8);
    this.outptr = this.inptr + size*8;

    this.cin = new Float32Array(kissFFTModule.HEAPU8.buffer, this.inptr, size*2);
    this.cout = new Float32Array(kissFFTModule.HEAPU8.buffer, this.outptr, size*2);

    this.forward = function(cin) {
        this.cin.set(cin);
        kiss_fft(this.fcfg, this.inptr, this.outptr);
        return new Float32Array(kissFFTModule.HEAPU8.buffer,
            this.outptr, this.size * 2);
    };

    this.inverse = function(cpx) {
        this.cin.set(cpx);
        kiss_fft(this.icfg, this.inptr, this.outptr);
        return new Float32Array(kissFFTModule.HEAPU8.buffer,
            this.outptr, this.size * 2);
    };

    this.dispose = function() {
        kissFFTModule._free(this.inptr);
        kiss_fft_free(this.fcfg);
        kiss_fft_free(this.icfg);
    }
};

var FFTR = function (size) {

    this.size = size;
    this.fcfg = kiss_fftr_alloc(size, false);
    this.icfg = kiss_fftr_alloc(size, true);

    this.rptr = kissFFTModule._malloc(size*4 + (size+2)*4);
    this.cptr = this.rptr + size*4;

    this.ri = new Float32Array(kissFFTModule.HEAPU8.buffer, this.rptr, size);
    this.ci = new Float32Array(kissFFTModule.HEAPU8.buffer, this.cptr, size+2);

    this.forward = function(real) {
        this.ri.set(real);
        kiss_fftr(this.fcfg, this.rptr, this.cptr);
        return new Float32Array(kissFFTModule.HEAPU8.buffer,
            this.cptr, this.size + 2);
    };

    this.inverse = function(cpx) {
        this.ci.set(cpx);
        kiss_fftri(this.icfg, this.cptr, this.rptr);
        return new Float32Array(kissFFTModule.HEAPU8.buffer,
            this.rptr, this.size);
    };

    this.dispose = function() {
        kissFFTModule._free(this.rptr);
        kiss_fftr_free(this.fcfg);
        kiss_fftr_free(this.icfg);
    }
};

const sinc = (n) => Math.sin(Math.PI * n) / (Math.PI * n);
const bessi0 = (x) => {
    /* Evaluate modified Bessel function In(x) and n=0. */
    const ax = Math.abs(x);
    if (ax < 3.75) {
        const y = (x / 3.75) * (x / 3.75);
        return (1.0 +
            y *
            (3.5156229 +
                y *
                (3.0899424 +
                    y *
                    (1.2067492 +
                        y * (0.2659732 + y * (0.360768e-1 + y * 0.45813e-2))))));
    }
    else {
        const y = 3.75 / ax;
        return ((Math.exp(ax) / Math.sqrt(ax)) *
            (0.39894228 +
                y *
                (0.1328592e-1 +
                    y *
                    (0.225319e-2 +
                        y *
                        (-0.157565e-2 +
                            y *
                            (0.916281e-2 +
                                y *
                                (-0.2057706e-1 +
                                    y *
                                    (0.2635537e-1 +
                                        y * (-0.1647633e-1 + y * 0.392377e-2)))))))));
    }
};
/**
 * Windowing functions.
 */
const windows = {
    hann: (n, points) => 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (points - 1)),
    hamming: (n, points) => 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (points - 1)),
    cosine: (n, points) => Math.sin((Math.PI * n) / (points - 1)),
    lanczos: (n, points) => sinc((2 * n) / (points - 1) - 1),
    gaussian: (n, points, alpha = 0.4) => {
        return Math.pow(Math.E, -0.5 * Math.pow((n - (points - 1) / 2) / ((alpha * (points - 1)) / 2), 2));
    },
    tukey: (n, points, alpha = 0.5) => {
        if (n < 0.5 * alpha * (points - 1)) {
            return (0.5 * (1 + Math.cos(Math.PI * ((2 * n) / (alpha * (points - 1)) - 1))));
        }
        else if (n < (1 - 0.5 * alpha) * (points - 1)) {
            return 1;
        }
        else {
            return (0.5 *
                (1 +
                    Math.cos(Math.PI * ((2 * n) / (alpha * (points - 1)) + 1 - 2 / alpha))));
        }
    },
    blackman: (n, points) => {
        return (0.42 -
            0.5 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            0.08 * Math.cos((4 * Math.PI * n) / (points - 1)));
    },
    exact_blackman: (n, points) => {
        return (0.4243801 -
            0.4973406 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            0.0782793 * Math.cos((4 * Math.PI * n) / (points - 1)));
    },
    kaiser: (n, points, alpha = 3) => {
        return (bessi0(Math.PI * alpha * Math.sqrt(1 - Math.pow((2 * n) / (points - 1) - 1, 2))) / bessi0(Math.PI * alpha));
    },
    nuttall: (n, points) => {
        return (0.355768 -
            0.487396 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            0.144232 * Math.cos((4 * Math.PI * n) / (points - 1)) -
            0.012604 * Math.cos((6 * Math.PI * n) / (points - 1)));
    },
    blackman_harris: (n, points) => {
        return (0.35875 -
            0.48829 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            0.14128 * Math.cos((4 * Math.PI * n) / (points - 1)) -
            0.01168 * Math.cos((6 * Math.PI * n) / (points - 1)));
    },
    blackman_nuttall: (n, points) => {
        return (0.3635819 -
            0.3635819 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            0.1365995 * Math.cos((4 * Math.PI * n) / (points - 1)) -
            0.0106411 * Math.cos((6 * Math.PI * n) / (points - 1)));
    },
    flat_top: (n, points) => {
        return (1 -
            1.93 * Math.cos((2 * Math.PI * n) / (points - 1)) +
            1.29 * Math.cos((4 * Math.PI * n) / (points - 1)) -
            0.388 * Math.cos((6 * Math.PI * n) / (points - 1)) +
            0.032 * Math.cos((8 * Math.PI * n) / (points - 1)));
    },
};
/**
 * Applies a Windowing Function to an array.
 */
const applyWindowFunction = (data_array, windowing_function, alpha) => {
    const datapoints = data_array.length;
    /* For each item in the array */
    for (let n = 0; n < datapoints; ++n) {
        /* Apply the windowing function */
        data_array[n] *= windowing_function(n, datapoints, alpha);
    }
    return data_array;
};
/* -------- Exports -------- */
/**
 * A helper to actually create window functions.
 */
const create_window_function = (win) => (array, alpha) => applyWindowFunction(array, windows[win], alpha);
/**
 * Adds a function for each window to the module exports.
 */
const hann = create_window_function("hann");
const hamming = create_window_function("hamming");
const cosine = create_window_function("cosine");
const lanczos = create_window_function("lanczos");
const gaussian = create_window_function("gaussian");
const tukey = create_window_function("tukey");
const blackman = create_window_function("blackman");
const exact_blackman = create_window_function("exact_blackman");
const kaiser = create_window_function("kaiser");
const nuttall = create_window_function("nuttall");
const blackman_harris = create_window_function("blackman_harris");
const blackman_nuttall = create_window_function("blackman_nuttall");
const flat_top = create_window_function("flat_top");
//# sourceMappingURL=windowing.js.map
const findWindowFunction = (name) => {
    switch (name) {
        case "hann":
            return hann;
        case "hamming":
            return hamming;
        case "cosine":
            return cosine;
        case "lanczos":
            return lanczos;
        case "gaussian":
            return gaussian;
        case "tukey":
            return tukey;
        case "blackman":
            return blackman;
        case "exact_blackman":
            return exact_blackman;
        case "kaiser":
            return kaiser;
        case "nuttall":
            return nuttall;
        case "blackman_harris":
            return blackman_harris;
        case "blackman_nuttall":
            return blackman_nuttall;
        case "flat_top":
            return flat_top;
    }
};
const calculateMagnitude = (complexData) => {
    const newData = [];
    for (let i = 0; i < complexData.length; i = i + 2) {
        newData.push(Math.sqrt(complexData[i] * complexData[i] +
            complexData[i + 1] * complexData[i + 1]));
    }
    return newData;
};
const fft = (inputData) => {
    const dataLength = inputData.length;
    const fftr = new FFTR(dataLength);
    const transform = fftr.forward(inputData);
    fftr.dispose();
    const magnitude = calculateMagnitude(transform);
    return magnitude;
};
const calculateFFTFreq = (dataLength, sampleRate) => {
    const fftfreq = Array.from(Array(dataLength), (x, i) => i * (sampleRate / dataLength));
    return fftfreq;
};
const calculateWindows = (inputData, windowSize, overlap = 0.5, windowingFunction) => {
    const wf = findWindowFunction(windowingFunction);
    let overlapFactor = 1 / (1 - overlap);
    [overlap, windowSize, overlapFactor] = roundOverlapAndWindowSize(windowSize, overlap);
    const dataLength = inputData.length;
    if (windowSize > dataLength) {
        throw new Error("Window size must be smaller than data size");
    }
    if (overlapFactor > windowSize / 2) {
        throw new Error("Too much overlap for the window size");
    }
    const numberOfWindows = Math.floor((overlapFactor * dataLength) / windowSize) - (overlapFactor - 1);
    const windows = [];
    const stepSize = windowSize / overlapFactor;
    //Run window funciton on raw data
    for (let i = 0; i < numberOfWindows; i++) {
        windows.push(wf(inputData.slice(i * stepSize, i * stepSize + windowSize)));
    }
    return windows;
};
const calculatePSDWindows = (inputData, sampleRate, windowSize, overlap = 0.5, windowingFunction) => {
    [overlap, windowSize] = roundOverlapAndWindowSize(windowSize, overlap);
    const windows = calculateWindows(inputData, windowSize, overlap, windowingFunction);
    const scalingFactor = 1 /
        (sampleRate *
            hann(Array(windowSize).fill(1))
                .map((element) => element ^ 2)
                .reduce((prev, current) => prev + current));
    //Calculate PSD for each window
    const psdWindows = windows.map((window) => fft(window).map((result) => (result ^ 2) * scalingFactor));
    return psdWindows;
};
/**
 * Raw FFT of data. 50% window overlap is standard.
 *
 * @return  {[number[], number[]]}  [Frequencies, FFT]
 */
const calculateFFT = (inputData, sampleRate, windowSize, overlap = 0.5, windowingFunction = "hann") => {
    [overlap, windowSize] = roundOverlapAndWindowSize(windowSize, overlap);
    const windows = calculateWindows(inputData, windowSize, overlap, windowingFunction);
    const fftWindows = windows.map((window) => fft(window));
    //Combine windows
    const fftResult = fftWindows.reduce((total, current) => current.map((item, i) => total[i] + item), Array(windowSize).fill(0));
    const fftfreq = calculateFFTFreq(windowSize, sampleRate);
    return [fftfreq, fftResult];
};
/**
 * Implementation of Welch's method of spectral density estimation.
 *
 * @return  {[number[], number[]]}  [Frequencies, PSD]
 */
const welch = (inputData, sampleRate, windowSize, overlap = 0.5, windowingFunction = "hann") => {
    [overlap, windowSize] = roundOverlapAndWindowSize(windowSize, overlap);
    const psdWindows = calculatePSDWindows(inputData, sampleRate, windowSize, overlap, windowingFunction);
    //Combine windows
    const psd = psdWindows.reduce((total, current) => current.map((item, i) => total[i] + item), Array(windowSize).fill(0));
    const fftfreq = calculateFFTFreq(windowSize, sampleRate);
    return [fftfreq, psd];
};
/**
 * Calcuate window size (rounded)
 *
 * @return  number  window size (rounded)
 */
const roundOverlapAndWindowSize = (windowSize, overlap) => {
    const overlapFactor = Math.round(1 / (1 - overlap));
    //Rounds down the window size to an even number
    const roundedWindowSize = overlapFactor * 2 * Math.floor(windowSize / (overlapFactor * 2));
    const roundedOverlap = 1 - 1 / overlapFactor;
    return [roundedOverlap, roundedWindowSize, overlapFactor];
};
/**
 * Generates a two dimensional array, and set of corresponding frequencies
 * for plotting a spectogram of PSDs
 *
 * @return  {[number[], number[]]}  [Frequencies, PSDs]
 */
const spectrogram = (inputData, sampleRate, windowSize, overlap = 0.5, windowingFunction = "hann") => {
    [overlap, windowSize] = roundOverlapAndWindowSize(windowSize, overlap);
    const psdWindows = calculatePSDWindows(inputData, sampleRate, windowSize, overlap, windowingFunction);
    const psdWindowTranspose = psdWindows[0].map((x, i) => psdWindows.map((x) => x[i]));
    const fftfreq = calculateFFTFreq(windowSize, sampleRate);
    return [fftfreq, psdWindowTranspose];
};

if (HAS_INPUT["EEG Data"] && INPUT["EEG Data"]) {
    if(SETTINGS_CHANGED["Channel name"])
    {
        if (IN_VISUALIZATION) {
            var spectrumData = CACHE["spectrData"];
            if (!spectrumData) {
                var div = document.createElement("div");

                div.id = 'chart-PSD';
                div.style.marginTop = "50px";
                div.style.height = "90%";
                div.style.width = "100%";
                var data = INPUT["EEG Data"];
                //var dwqe = data.channels[0].samples[0];
                var spectrum = welch(data.channels[8].samples,512,512);

                CACHE["spectrData"] = spectrum;

        }
            var data = INPUT["EEG Data"];
            //var dwqe = data.channels[0].samples[0];
            var spectrum = welch(data.channels[8].samples,512,512);
            DATA["Spectrum"] = spectrum;

    } else
    {
        CACHE["spectrData"] = null;
    }


}}
if (DATA["Spectrum"])
    OUTPUT["Spectrum"] = DATA["Spectrum"];