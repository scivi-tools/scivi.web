from asyncio.windows_events import NULL
from vosk import Model, KaldiRecognizer
import numpy as np
import os

if not os.path.exists("model"):
    print ("Please download the model from https://alphacephei.com/vosk/models and unpack as 'model' in the current folder.")

#PCM must be in mono channel
#First you must send SampleRate, then you can send PCM in mono channel. Then you're done, send message without PCM and you get text
if "MODEL" not in GLOB:
    GLOB['MODEL']= Model("model_russian")

if IN_VISUALIZATION:
    wav = INPUT['Audio Stream']
    if (wav['SampleRate']):
        # Large vocabulary free form recognition
        CACHE['recognizer'] = KaldiRecognizer(GLOB['MODEL'], wav['SampleRate'])
    if wav["PCM"]:
        rec = CACHE['recognizer']
        rec.AcceptWaveform(np.fromstring(wav["PCM"], dtype=np.uint16)[0::2])
    else:
        OUTPUT["Text Speech"] = CACHE['recognizer'].FinalResult()
else:
    CACHE['recognizer'] = NULL

    
