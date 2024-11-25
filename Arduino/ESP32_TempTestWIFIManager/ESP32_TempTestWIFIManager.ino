#include <OneWire.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiManager.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

OneWire ds(D2);

// Zmienne globalne
String serverUrl;
unsigned long displayInterval;
unsigned long sendInterval;

unsigned long lastUpdateDisplay = 0;
unsigned long lastSendToServer = 0;

void setup() {
  // Inicjalizacja wyświetlacza OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    for (;;); // Jeśli inicjalizacja wyświetlacza się nie powiodła, zatrzymaj program
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Konfiguracja WiFi..."));
  display.display();

  // Konfiguracja parametrów WiFiManager
  WiFiManager wifiManager;

  WiFiManagerParameter custom_server("server", "Endpoint", "http://10.200.200.24:5000/api/temperature", 64);
  WiFiManagerParameter custom_displayInterval("dispInt", "Czas odśw. wyświetlacza (ms)", "5000", 10);
  WiFiManagerParameter custom_sendInterval("sendInt", "Czas wysyłania do serwera (ms)", "60000", 10);

  wifiManager.addParameter(&custom_server);
  wifiManager.addParameter(&custom_displayInterval);
  wifiManager.addParameter(&custom_sendInterval);

  wifiManager.setAPCallback([](WiFiManager* manager) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("AP Konfiguracja WiFi"));
    display.println(F("SSID: ESP32-Config"));
    display.display();
  });

  if (!wifiManager.autoConnect("ESP32-Config")) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("Blad WiFi"));
    display.display();
    delay(2000);
    ESP.restart();
  }

  // Ustawienie wartości na podstawie wprowadzonych parametrów
  serverUrl = custom_server.getValue();
  displayInterval = atol(custom_displayInterval.getValue());
  sendInterval = atol(custom_sendInterval.getValue());

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("Polaczono z WiFi"));
  display.display();
  delay(1000);
}

void loop() {
  byte data[9];
  byte addr[8];
  float celsius;

  if (!ds.search(addr)) {
    ds.reset_search();
    delay(100);
    return;
  }

  if (OneWire::crc8(addr, 7) != addr[7]) {
    return;
  }

  byte type_s;
  switch (addr[0]) {
    case 0x10:
      type_s = 1;
      break;
    case 0x28:
    case 0x22:
      type_s = 0;
      break;
    default:
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Nieznane urzadz.");
      display.display();
      delay(1000);
      return;
  }

  ds.reset();
  ds.select(addr);
  ds.write(0x44, 1);
  delay(750);

  ds.reset();
  ds.select(addr);
  ds.write(0xBE);

  for (int i = 0; i < 9; i++) {
    data[i] = ds.read();
  }

  int16_t raw = (data[1] << 8) | data[0];
  if (type_s) {
    raw = raw << 3;
    if (data[7] == 0x10) {
      raw = (raw & 0xFFF0) + 12 - data[6];
    }
  } else {
    byte cfg = (data[4] & 0x60);
    if (cfg == 0x00) raw = raw & ~7;
    else if (cfg == 0x20) raw = raw & ~3;
    else if (cfg == 0x40) raw = raw & ~1;
  }

  celsius = (float)raw / 16.0;

  // Aktualizuj wyświetlacz co displayInterval
  if (millis() - lastUpdateDisplay >= displayInterval) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("Temperatura:");
    display.setCursor(0, 15);
    display.print("Celsjusz: ");
    display.print(celsius, 2);
    display.display();
    lastUpdateDisplay = millis();
  }

  // Wysyłaj temperaturę do API co sendInterval
  if (millis() - lastSendToServer >= sendInterval && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl.c_str());
    http.addHeader("Content-Type", "application/json");
    String jsonPayload = "{\"temperature\":" + String(celsius, 2) + "}";
    int httpResponseCode = http.POST(jsonPayload);

    display.setCursor(0, 30);
    if (httpResponseCode > 0) {
      display.print("Wyslano, kod: ");
      display.println(httpResponseCode);
    } else {
      display.print("Blad wysylania");
    }
    display.display();
    http.end();

    lastSendToServer = millis();
  }
}
