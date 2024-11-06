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

const char* serverUrl = "http://10.200.200.24:5000/api/temperature"; // URL do API
unsigned long lastUpdateDisplay = 0;
unsigned long lastSendToServer = 0;
const unsigned long displayInterval = 5000; // Czas odświeżania wyświetlacza (5 sekund)
const unsigned long sendInterval = 60000;   // Czas wysyłania do serwera (1 minuta)

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

  // Użycie WiFiManager do konfiguracji WiFi
  WiFiManager wifiManager;
  wifiManager.setAPCallback([](WiFiManager* manager) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("AP Konfiguracja WiFi"));
    display.println(F("SSID: ESP32-Config"));
    display.display();
  });

  // autoConnect wywołuje portal konfiguracji, jeśli nie ma zapisanych danych WiFi lub połączenie się nie powiedzie
  if (!wifiManager.autoConnect("ESP32-Config")) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("Blad WiFi"));
    display.display();
    delay(2000);
    ESP.restart();  // Restart ESP32, jeśli nie udało się połączyć
  }

  // Pomyślne połączenie z WiFi
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("Polaczono z WiFi"));
  display.display();
  delay(1000);  // Poczekaj na wyświetlenie wiadomości
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
      type_s = 1;  // DS18S20
      break;
    case 0x28:
    case 0x22:
      type_s = 0;  // DS18B20 i DS1822
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
  ds.write(0x44, 1);  // Rozpocznij konwersję temperatury
  delay(750);  // Oczekiwanie na zakończenie konwersji

  ds.reset();
  ds.select(addr);
  ds.write(0xBE);  // Odczytaj Scratchpad

  for (int i = 0; i < 9; i++) {
    data[i] = ds.read();
  }

  int16_t raw = (data[1] << 8) | data[0];
  if (type_s) {  // Jeśli DS18S20, dostosuj wartość
    raw = raw << 3;  // Rozdzielczość 9-bitowa
    if (data[7] == 0x10) {
      raw = (raw & 0xFFF0) + 12 - data[6];
    }
  } else {  // Jeśli DS18B20 lub DS1822, sprawdź rozdzielczość
    byte cfg = (data[4] & 0x60);
    if (cfg == 0x00) raw = raw & ~7;       // 9-bitowa rozdzielczość
    else if (cfg == 0x20) raw = raw & ~3;  // 10-bitowa
    else if (cfg == 0x40) raw = raw & ~1;  // 11-bitowa
    // Standardowo 12-bitowa rozdzielczość
  }

  celsius = (float)raw / 16.0;

  // Aktualizuj wyświetlacz co 5 sekund
  if (millis() - lastUpdateDisplay >= displayInterval) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("Temperatura:");
    display.setCursor(0, 15);
    display.print("Celsjusz: ");
    display.print(celsius, 2);  // Wyświetl temperaturę z dwoma miejscami po przecinku
    display.display();
    lastUpdateDisplay = millis(); // Zaktualizuj czas ostatniego odświeżenia wyświetlacza
  }

  // Wysyłaj temperaturę do API co 1 minutę
  if (millis() - lastSendToServer >= sendInterval && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String jsonPayload = "{\"temperature\":" + String(celsius, 2) + "}"; // Wysyłanie z dwoma miejscami po przecinku
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

    lastSendToServer = millis(); // Zaktualizuj czas ostatniego wysłania danych do serwera
  }
}
