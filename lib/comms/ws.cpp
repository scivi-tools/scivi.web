String msg = String("[{\"") + String((int)SETTINGS_VAL["Node Address"]) + "\":" + String((float)INPUT["TX"]) + String("}]");
g_webSocket.broadcastTXT(msg);