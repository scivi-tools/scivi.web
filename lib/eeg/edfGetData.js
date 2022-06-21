
function loadEDF(fileBuf){

    let edf = new edfjs.EDF();
    edf.read_buffer(fileBuf, false);

    let subject = edf.pid;
    let recording = edf.rid;
    let starttime = edf.startdatetime;

    let channels = edf.channels.map(channel => {

        let samples = new Array(channel.blob.length);
        for(let i = 0; i < channel.blob.length; i++){
            samples[i] = channel.blob[i];
        }

        return {
            'label': channel.label,
            'sample_rate': channel.sampling_rate,
            'physical_dimension': channel.physical_dimension,
            'samples': samples
        }
    });

    return {
        subject: subject,
        recording: recording,
        start_time: starttime,
        channels: channels,
    };
}

if (SETTINGS_VAL["EDF File"]) {
    if (SETTINGS_CHANGED["EDF File"]) {
        SETTINGS_CHANGED["EDF File"] = false;
        var fr = new FileReader();
        fr.onload = function (res) {
            DATA["EDF"] = loadEDF(res.target.result);
            PROCESS();
        };
        fr.readAsArrayBuffer(SETTINGS_VAL["EDF File"]);


    }
}
if (DATA["EDF"])
    OUTPUT["Table"] = DATA["EDF"];
