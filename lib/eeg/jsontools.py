#!/usr/bin/env false

from time import time, strftime, gmtime
from uuid import uuid4 as uuid
from uuid import UUID
import json
from dateutil import parser
import datetime

def trydict(x):
    if isinstance(x, (datetime.date, datetime.datetime)):
        return x.strftime("%Y-%m-%dT%T.%f%z")
    elif isinstance(x, UUID):
        return str(x)
    else:
        try:
            return x.__dict__
        except AttributeError:
            return json.dumps(x)

def boolean(s):
    if (isinstance(s, bool)):
        return s
    elif (isinstance(s, str)):
        return s.lower() == "true"
    else:
        raise ValueError("Object {} cannot be converted to bool!".format(s))

def convert(d1, d2, f, l):
    for i in l:
        d1[i] = f(d2[i])

def unpack(d1, d2, l):
    for i in l:
        ll, f = i
        convert(d1, d2, f, ll)

def lmap(f):
    def h(x):
        return list(map(f, x))
    return h

def toUUID(x):
    if (x):
        if (isinstance(x, UUID)):
            return x
        else:
            return UUID(x)
    else:
        return None
