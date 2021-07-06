#!/usr/bin/env python3

LDA_MODE_TRAIN = 0
LDA_MODE_EVAL = 1

LDA_INPUT_SIGNAL = 'Signal'
LDA_INPUT_LABELS = 'Labels'

LDA_SETTING_MODE = 'Mode'

LDA_OUTPUT_RESULT = 'Result'

MODULE_PREFIX = "LDA_rLWC2bcgVr"

LDA_KEY = 'LDA'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

raw = INPUT[LDA_INPUT_SIGNAL]
labels = INPUT[LDA_INPUT_LABELS]

mode = int(SETTINGS_VAL[LDA_SETTING_MODE])

lda = GLOB.get(p(LDA_KEY))
if not lda:
    from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
    lda = LinearDiscriminantAnalysis()
    GLOB[p(LDA_KEY)] = lda

if mode == LDA_MODE_TRAIN:
    lda.fit(raw, labels)
elif mode == LDA_MODE_EVAL:
    OUTPUT[LDA_OUTPUT_RESULT] = lda.predict(raw)
else:
    raise ValueError()
