
#define BUTTON_PIN PB0

void INIT()
{
    pinMode(BUTTON_PIN, INPUT);
}

void LOOP()
{
    OUTPUT["Pushed"] = digitalRead(BUTTON_PIN) == HIGH ? 0x1 : 0x0;
}
