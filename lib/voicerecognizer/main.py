from base64 import b64decode
import os
from vosk import Model, KaldiRecognizer
import json

if MODE == "INITIALIZATION":
    if not os.path.exists("lib/voicerecognizer/model"):
        print ("Please download the model from https://alphacephei.com/vosk/models and unpack as 'model' in the .", os.getcwd(), "/lib/voicerecognizer")
    elif "MODEL" not in STATE:  
        STATE['MODEL']= Model("lib/voicerecognizer/model")
        print('model loaded')

elif MODE == "RUNNING":
    #PCM must be in mono channel
    #First you must send SampleRate, then you can send PCM in mono channel. Then you're done, send message without PCM and you get text
    if "MODEL" not in STATE:
        print('model not loaded')
    elif 'Audio Stream' in INPUT:
        wav = INPUT["Audio Stream"]
        if 'SampleRate' in wav and "PCM" in wav:
            SampleRate = wav['SampleRate']
            pcm = wav['PCM']
            if 'recognizer' not in CACHE:
                # Large vocabulary free form recognition
                CACHE['recognizer'] = KaldiRecognizer(STATE['MODEL'], SampleRate)
                CACHE['SampleRate'] = SampleRate
                print('recognizer created')
                #generate header for wav file
                #with open('aud.wav', "ab") as f:
                #    f.write(b'RIFF')
                #    f.write(b'0000')
                #    f.write(bytes.fromhex('57415645666D7420'))
                #    f.write(bytes.fromhex('10000000'))
                #    f.write(bytes.fromhex('0100'))
                #    f.write(bytes.fromhex('0100'))
                #    f.write(bytes.fromhex('44AC0000'))
                #    f.write(bytes.fromhex('88580100'))
                #    f.write(bytes.fromhex('0200'))
                #    f.write(bytes.fromhex('1000'))
                #    f.write(b'data')
                #    f.write(b'0000')

            elif CACHE['SampleRate'] == SampleRate:
                rec = CACHE['recognizer']
                header, encode = pcm.split(',', 1)
                b = b64decode(encode)
                #save pcm to wav file (for debug)
                #with open('aud.wav', "ab") as f:
                #    f.write(b)
                if rec.AcceptWaveform(b):
                    result = json.loads(rec.Result()) 
                    print('recognized', result["text"])
                    OUTPUT["Text Speech"] = result["text"]
            else: print("Error! SampleRate has changed. It must be constant")

    
