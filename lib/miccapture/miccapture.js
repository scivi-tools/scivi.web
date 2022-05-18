// Copyright 2022 JohnCorn
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function OnDataRecorded(sampleRate, blob)
{
    let recorder = CACHE['RECORDER']
    blob = blob.slice(44);//skip wav header
    var reader = new FileReader();
    reader.addEventListener("loadend", function() {
    // reader.result contains the contents of blob as a typed array
    console.log(reader.result);
    });
    reader.readAsArrayBuffer(blob);
    //console.log(blob.text());
    OUTPUT["Mic Audio"] ={ 
        "SampleRate": sampleRate,
        "PCM": blob.text()
    };
    PROCESS();
    recorder.reset()
    recorder.startRecording();
}

if (IN_VISUALIZATION)
{
    if (!CACHE["RECORDER"])
    {
        navigator.mediaDevices.getUserMedia({video: false, audio: true}).
        then(async function(stream) {
            CACHE['RECORDER'] = new RecordRTCPromisesHandler(stream, {
                type: 'audio',
                mimeType: 'audio/wav',
                recorderType: StereoAudioRecorder,
                disableLogs: false,
                checkForInactiveTracks: true,
                numberOfAudioChannels: 1,
                sampleRate: 44000,
                desiredSampRate: 44000,
                timeSlice: 1000,
                ondataavailable: OnDataRecorded.bind(this, 44000)
            });
            CACHE['RECORDER'].startRecording();
            PROCESS();
        });
    }
    /*else{
        let recorder = CACHE["RECORDER"];
        recorder.stopRecording(() => {
            
            recorder.reset();
            recorder.startRecording();
            PROCESS();
        });
    }*/
}
else
{
    let recorder = CACHE["RECORDER"];
    if (recorder)
        recorder.stopRecording();
    CACHE['RECORDER'] = null;
}