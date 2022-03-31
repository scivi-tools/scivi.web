
#include "OneWireSlave.h"

// ATMEL ATTINY45 / ARDUINO
//
//                  +-\/-+
// Ain0 (D 5) PB5  1|    |8  Vcc
// Ain3 (D 3) PB3  2|    |7  PB2 (D 2)  Ain1
// Ain2 (D 4) PB4  3|    |6  PB1 (D 1) pwm1
//            GND  4|    |5  PB0 (D 0) pwm0
//                  +----+

#define ONE_WIRE_PIN PB1

#define CMD_POLL 0xDD

OneWireSlave g_1w(ONE_WIRE_PIN);
uint8_t g_rom[8] = %<ROM>;
%<OUTPUTS>

#include "worker.h"

void setup()
{
    g_1w.setRom(g_rom);
    INIT();
    delay(100);
}

void loop()
{
    LOOP();
    g_1w.waitForRequest(false);
    switch (g_1w.recv())
    {
        case CMD_POLL:
            %<SEND>
            break;

        default:
            break;
    }
}
