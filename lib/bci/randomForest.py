#import joblib
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

features = INPUT[RF_INPUT_FEATURES]
labels = INPUT[RF_INPUT_LABELS]
np.savetxt("features.csv", features, delimiter=",")
np.savetxt("labels.csv", np.array([0 if i == 'relax' else 1 for i in labels]), delimiter=",")

mode = int(SETTINGS_VAL[RF_SETTING_MODE])
model_file = SETTINGS_VAL[RF_SETTING_MODEL]

rf = GLOB.get(p(RF_KEY))

if not rf:
    from sklearn.ensemble import RandomForestClassifier
    rf = RandomForestClassifier()
    GLOB[p(RF_KEY)] = rf

if mode == RF_MODE_TRAIN:
    labels = INPUT[RF_INPUT_LABELS]
    rf.fit(features, labels)
    joblib.dump(rf, model_file)
elif mode == RF_MODE_EVAL:
    rf = joblib.load(model_file)
    OUTPUT[RF_OUTPUT_RESULT] = rf.predict(features)
else:
    raise ValueError()
