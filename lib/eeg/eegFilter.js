
const makeNotchFilter = (frequency,sps,bandwidth) => {
    return new Biquad('notch',frequency,sps,Biquad.calcNotchQ(frequency,bandwidth),0);
}

const makeBandpassFilter = (freqStart,freqEnd,sps,resonance=Math.pow(10,Math.floor(Math.log10(Biquad.calcCenterFrequency(freqStart,freqEnd))))) => {
    return new Biquad('bandpass',
        Biquad.calcCenterFrequency(freqStart,freqEnd),
        sps,
        Biquad.calcBandpassQ(Biquad.calcCenterFrequency(freqStart,freqEnd),Biquad.calcBandwidth(freqStart,freqEnd),resonance),
        0);
}

if (INPUT["EEG Data"]) {
    if (SETTINGS_CHANGED["Filter mode"] && SETTINGS_VAL["Filter mode"] !== "0") {
        var preProcesseddata = CACHE["Filtered data"];
        if(!preProcesseddata)
        {
            var data = INPUT["EEG Data"];
            if(SETTINGS_VAL["Filter mode"] === "1")
            {
                preProcesseddata = data;

                (preProcesseddata.channels).forEach((channel, index) => {
                    notchFilter = makeNotchFilter(50,512,2);
                    if (index !== 20) {
                        (channel.samples).forEach((sample,i) => {
                            preProcesseddata.channels[index].samples[i] = notchFilter.applyFilter(sample);
                        });
                    }

                });
            }
            if(SETTINGS_VAL["Filter mode"] === "2")
            {
                preProcesseddata = data;

                (preProcesseddata.channels).forEach((channel, index) => {
                    bapnpassFilter = makeBandpassFilter(1,70,512,1);
                    if (index !== 20) {
                        (channel.samples).forEach((sample,i) => {
                            preProcesseddata.channels[index].samples[i] = bapnpassFilter.applyFilter(sample);
                        });
                    }

                });
            }
            CACHE["Filtered data"] = preProcesseddata;
        }



        OUTPUT["EEG Data"] = preProcesseddata;
    }
}
