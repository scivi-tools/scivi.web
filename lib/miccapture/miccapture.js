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

if (IN_VISUALIZATION)
{
    if (!CACHE["RECORDER"])
    {
        /*navigator.mediaDevices.getUserMedia({video: false, audio: true}).
        then(async function(stream) {
            CACHE['RECORDER'] = new RecordRTCPromisesHandler(stream, {
                type: 'audio'
            });
            recorder.startRecording();
            PROCESS();
        });*/
        CACHE["RECORDER"] = 'test'
        alert('inserted');
    }
    else{
        /*let recorder = DATA["RECORDER"];
        log(recorder);
        recorder.stopRecording();
            
        OUTPUT["Audio Stream"] ={ 
                                    "SampleRate": recorder.bitsPerSecond,
                                    "PCM": recorder.getBlob()
                                };
        recorder.reset();
        recorder.startRecording();*/
        //PROCESS();
    }
}
else
{
    /*let recorder = CACHE["RECORDER"];
    if (recorder)
        recorder.stopRecording();
        CACHE['RECORDER'] = null;*/
}