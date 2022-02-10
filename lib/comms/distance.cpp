const int trigPin = 14; // D5
const int echoPin = 16; // D0
pinMode(trigPin, OUTPUT);
pinMode(echoPin, INPUT);
digitalWrite(trigPin, LOW);
delayMicroseconds(2);
digitalWrite(trigPin, HIGH);
delayMicroseconds(10);
digitalWrite(trigPin, LOW);
long duration = pulseIn(echoPin, HIGH, 6000);
OUTPUT["Value"] = (float)duration * 0.34f / 2.0f;