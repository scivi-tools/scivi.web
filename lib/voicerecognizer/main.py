from base64 import b64decode
import datetime
import os
import sys
from vosk import Model, KaldiRecognizer
import json

def WriteWAVHeader(path, sample_rate: int):
    with open(path, "wb") as f:
        f.write(b'RIFF')
        f.write(b'0000')
        f.write(bytes.fromhex('57415645666D7420'))
        f.write(bytes.fromhex('10000000'))
        f.write(bytes.fromhex('0100'))
        f.write(bytes.fromhex('0100'))
        f.write(sample_rate.to_bytes(4, sys.byteorder))
        f.write((2 * sample_rate).to_bytes(4, sys.byteorder))
        f.write(bytes.fromhex('0200'))
        f.write(bytes.fromhex('1000'))
        f.write(b'data')
        f.write(b'0000')
def WriteWAVPCM(path, pcm_bytes):
    with open(path, "ab") as f:
        f.write(pcm_bytes)

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
                if SETTINGS_VAL["Record Voice"] and \
                    not SETTINGS_VAL["WAV Name"] is None and \
                    len(SETTINGS_VAL["WAV Name"]):
                    if not os.path.exists('recognized'):
                        os.makedirs('recognized')
                    timestamp = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
                    CACHE["WAV_PATH"] = "recognized/" + SETTINGS_VAL["WAV Name"] + "_" + timestamp + ".wav"
                    WriteWAVHeader(CACHE["WAV_PATH"], SampleRate)

            if CACHE['SampleRate'] == SampleRate:
                rec = CACHE['recognizer']
                header, encode = pcm.split(',', 1)
                pcm_bytes = b64decode(encode)
                #save pcm to wav file (for debug)
                if "WAV_PATH" in CACHE:
                    WriteWAVPCM(CACHE["WAV_PATH"], pcm_bytes)
                if rec.AcceptWaveform(pcm_bytes):
                    result = json.loads(rec.Result())["text"] 
                    if len(result) > 0:
                        print('recognized', result)
                        OUTPUT["Text Speech"] = result
            else: print("Error! SampleRate has changed. It must be constant")
        elif wav == "End" and 'recognizer' in CACHE:
            rec = CACHE['recognizer']
            result = json.loads(rec.FinalResult())["text"] 
            if len(result) > 0:
                print('recognized', result)
                OUTPUT["Text Speech"] = result
            else: OUTPUT["Text Speech"] = "???"


    
