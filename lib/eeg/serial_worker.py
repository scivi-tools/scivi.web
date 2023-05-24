#!/usr/bin/env python3

SERIAL_SETTING_PORT_NAME = 'Port Name'
SERIAL_SETTING_SPEED = 'Speed'

SERIAL_INPUT_DATA = 'Data'

MODULE_PREFIX = "SERIAL_r3Q0v7ka9q"

SERIAL_KEY = 'SERIAL'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

ser = GLOB.get(p(SERIAL_KEY))

if not ser:
    import serial
    port_name = SETTINGS_VAL[SERIAL_SETTING_PORT_NAME]
    speed = int(SETTINGS_VAL[SERIAL_SETTING_SPEED])

    ser = serial.Serial(port_name, speed)

    GLOB[p(SERIAL_KEY)] = ser

if MODE == 'INITIALIZATION':
    pass
else:
    data = str(INPUT[SERIAL_INPUT_DATA])

    ser.write(data.encode('utf-8'))

PROCESS()
