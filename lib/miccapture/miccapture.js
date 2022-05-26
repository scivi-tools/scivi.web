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
    if (blob && blob.size > 44)
    {
        blob = blob.slice(44) // skip wav header
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
            // reader.result contains the contents of blob as a typed array
            CACHE["Mic Audio"] = { 
                "SampleRate": sampleRate,
                "PCM": reader.result
            };
            PROCESS();
        });
        reader.readAsDataURL(blob);
    }
}

if (IN_VISUALIZATION)
{
    if (!CACHE["RECORDER"])
    {
        const SampleRate = parseInt(SETTINGS_VAL['SampleRate']) || 44100;
        if (SampleRate < 22050 || SampleRate > 96000)
            alert('SampleRate must be in range from 22050 to 96000')
        navigator.mediaDevices.getUserMedia({video: false, audio: true}).
        then(async function(stream) {
            CACHE["RECORDER"] = new RecordRTCPromisesHandler(stream, {
                type: 'audio',
                mimeType: 'audio/wav',
                recorderType: StereoAudioRecorder,
                disableLogs: true,
                checkForInactiveTracks: true,
                numberOfAudioChannels: 1,
                sampleRate: SampleRate,
                desiredSampRate: SampleRate,
                timeSlice: 200,
                bufferSize: 4096,
                ondataavailable: OnDataRecorded.bind(this, SampleRate)
            });
            CACHE["RECORDER"].startRecording();
            PROCESS();
        });
    }
    if (CACHE["Mic Audio"])
    {
        OUTPUT["Mic Audio"] = CACHE["Mic Audio"];
        CACHE["Mic Audio"] = null;
    }
}
else
{
    let recorder = CACHE["RECORDER"];
    if (recorder)
    {
        recorder.stopRecording();
        recorder.destroy();
    }
    CACHE["RECORDER"] = null;
    CACHE["Mic Audio"] = null;
}