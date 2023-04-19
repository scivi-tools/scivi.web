class Biquad {
    constructor(type,freq,sps,Q=1/Math.sqrt(2),dbGain=0) {
        let types = ['bandpass','notch'];
        if(types.indexOf(type) < 0) {
            console.error("Valid types: 'bandpass','notch'");
            return false;
        }
        this.type = type;

        this.freq = freq;
        this.sps = sps;
        this.Q = Q;
        this.dbGain = dbGain;

        this.a0 = 0,this.a1 = 0,this.a2 = 0,
            this.b0 = 0,this.b1 = 0,this.b2 = 0;

        this.x1 = 0,this.x2 = 0,
            this.y1 = 0,this.y2 = 0;

        let A = Math.pow(10,dbGain/40);
        let omega = 2*Math.PI*freq/sps;
        let sn = Math.sin(omega)
        let cs = Math.cos(omega);
        let alpha = sn/(2*Q);
        let beta = Math.sqrt(A+A);

        this[type](A,sn,cs,alpha,beta);

        //scale constants
        this.b0 /= this.a0;
        this.b1 /= this.a0;
        this.b2 /= this.a0;
        this.a1 /= this.a0;
        this.a2 /= this.a0;

    }

    bandpass(A,sn,cs,alpha,beta) { //Stop lower and upper frequencies. Q = frequency_resonant / Bandwidth(to 3db cutoff line); frequency_resonant = Math.sqrt(f_low * f_high); So for 60Hz with 0.5Hz bandwidth: Fr = Math.sqrt(59.5*60.5). Q = Fr/0.5 = 120;
        this.b0 = alpha;
        this.b1 = 0;
        this.b2 = -alpha;
        this.a0 = 1+alpha;
        this.a1 = -2*cs;
        this.a2 = 1-alpha;
    }

    notch(A,sn,cs,alpha,beta) { //Stop a specific frequency
        this.b0 = 1;
        this.b1 = -2*cs;
        this.b2 = 1;
        this.a0 = 1+alpha;
        this.a1 = -2*cs;
        this.a2 = 1-alpha;
    }

    applyFilter(signal_step) { //Step the filter forward, return modulated signal amplitude
        let y = this.b0*signal_step + this.b1*this.x1 + this.b2*this.x2 - this.a1*this.y1 - this.a2*this.y2;
        this.x2 = this.x1;
        this.x1 = signal_step;
        this.y2 = this.y1;
        this.y1 = y;

        return y;
    }


    //Get the center frequency for your bandpass filter
    static calcCenterFrequency(freqStart,freqEnd) {
        return (freqStart+freqEnd) / 2;
    }

    static calcBandwidth(freqStart,freqEnd) {
        return (freqEnd-this.calcCenterFrequency(freqStart,freqEnd));
    }

    //Use for bandpass or peak filter //Q gets sharper as resonance approaches infinity. Set to 500 for example for a more precise filter. Recommended r: Math.floor(Math.log10(frequency))
    static calcBandpassQ (frequency, bandwidth, resonance=Math.pow(10,Math.floor(Math.log10(frequency)))) { //Use Math.sqrt(0.5) for low pass, high pass, and shelf filters
        let Q = resonance*Math.sqrt((frequency-bandwidth)*(frequency+bandwidth))/(2*bandwidth); //tweaked
        return Q;
    }

    static calcNotchQ (frequency, bandwidth, resonance=Math.pow(10,Math.floor(Math.log10(frequency)))) { //Q gets sharper as resonance approaches infinity. Recommended r: Math.floor(Math.log10(frequency))
        let Q = resonance*frequency*bandwidth/Math.sqrt((frequency-bandwidth)*(frequency+bandwidth)); // bw/f
        return Q;
    }

}
