from vosk import Model, KaldiRecognizer
import numpy as np
import os

if not os.path.exists("lib/voicerecognizer/model"):
    print ("Please download the model from https://alphacephei.com/vosk/models and unpack as 'model' in the .", os.getcwd(), "/lib/voicerecognizer")

#PCM must be in mono channel
#First you must send SampleRate, then you can send PCM in mono channel. Then you're done, send message without PCM and you get text
#if "MODEL" not in GLOB:
#    GLOB['MODEL']= Model("lib/voicerecognizer/model")
#    print('model loaded')

print('script executed')
if 'Audio Stream' in INPUT:
    pass
    #print(INPUT["Audio Stream"])
    #if (wav['SampleRate']):
        # Large vocabulary free form recognition
        #CACHE['recognizer'] = KaldiRecognizer(GLOB['MODEL'], wav['SampleRate'])
        #print('created recognizer')
    #if wav["PCM"]:
        #rec = CACHE['recognizer']
        #rec.AcceptWaveform(np.fromstring(wav["PCM"], dtype=np.uint16)[0::2])
        #print('recognized', rec.Result())
        #pass
    #else:
        #pass
        #OUTPUT["Text Speech"] = CACHE['recognizer'].FinalResult()
        #print(CACHE['recognizer'].FinalResult())

    
