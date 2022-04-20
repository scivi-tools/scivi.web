import joblib
import numpy as np

RF_MODE_TRAIN = 0
RF_MODE_EVAL = 1

RF_INPUT_FEATURES = 'Features'
RF_INPUT_LABELS = 'Labels'

RF_SETTING_MODE = 'Mode'
RF_SETTING_MODEL = 'Model File'

RF_OUTPUT_RESULT = 'Result'

MODULE_PREFIX = "RF_361e3acc"

RF_KEY = 'RF'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

if RF_INPUT_FEATURES in INPUT:
    features = INPUT[RF_INPUT_FEATURES]

    mode = int(SETTINGS_VAL[RF_SETTING_MODE])
    model_file = SETTINGS_VAL[RF_SETTING_MODEL]

    rf = GLOB.get(p(RF_KEY))

    if rf is None:
        from sklearn.ensemble import RandomForestClassifier
        rf = RandomForestClassifier()
        GLOB[p(RF_KEY)] = rf

    if mode == RF_MODE_TRAIN:
        labels = INPUT[RF_INPUT_LABELS]
        rf.fit(features, labels)
        joblib.dump(rf, model_file)
        print('Model saved')
    elif mode == RF_MODE_EVAL:
        rf = joblib.load(model_file)
        OUTPUT[RF_OUTPUT_RESULT] = rf.predict(features)
        print(OUTPUT[RF_OUTPUT_RESULT])
    else:
        raise ValueError()
