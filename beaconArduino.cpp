#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Configurações de Wi-Fi
const char* ssid = "Beacon Navigator";
const char* password = "Beacon2025";
const char* beaconBLEServerName = "BeaconNavigator.999";
const char* serverAddressIP = "http://192.168.137.1";  // Endereço do servidor
const char* serverAddressDir = ":5000/api/informes";  // Endereço da API

// UUIDs do BLE
#define SERVICE_UUID        "6e400001-b5a3-f393-e0a9-e50e24dcca93"
#define CHARACTERISTIC_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca93"

// Buffer para armazenar JSON
#define JSON_BUFFER_SIZE 1024
char jsonBuffer[JSON_BUFFER_SIZE] = {0};

// BLE
BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Configuração do tamanho de pacotes BLE
const int MTU_SIZE = 23;  // MTU padrão para BLE
int currentOffset = 0;

// Intervalo de envio de pacotes BLE
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 100;  // 100ms entre envios

// Função para conectar ao Wi-Fi
void connectToWiFi() {
  Serial.print("Conectando-se ao Wi-Fi ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(1000);
    Serial.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar ao Wi-Fi.");
  }
}

// Função para obter JSON do servidor
void fetchJSON() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverAddressIP) + serverAddressDir;
    Serial.print("Requisitando JSON de: ");
    Serial.println(url);

    http.begin(url);
    int httpResponseCode = http.GET();

    if (httpResponseCode == 200) {
      String response = http.getString();
      response.toCharArray(jsonBuffer, JSON_BUFFER_SIZE);
      Serial.println("JSON recebido:");
      Serial.println(jsonBuffer);
    } else {
      Serial.print("Erro ao obter JSON: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi não conectado!");
  }
}

// Função para enviar pedaços do JSON via BLE
void sendChunk() {
  if (deviceConnected && currentOffset < strlen(jsonBuffer)) {
    int chunkSize = min(MTU_SIZE, (int)(strlen(jsonBuffer) - currentOffset));
    char chunk[chunkSize + 1] = {0};
    strncpy(chunk, jsonBuffer + currentOffset, chunkSize);

    pCharacteristic->setValue(chunk);
    pCharacteristic->notify();

    currentOffset += chunkSize;
    Serial.print("Enviado: ");
    Serial.println(chunk);
  }
}

// Callbacks BLE
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer *pServer) {
      deviceConnected = true;
      Serial.println("Cliente BLE conectado.");
    }

    void onDisconnect(BLEServer *pServer) {
      deviceConnected = false;
      Serial.println("Cliente BLE desconectado.");
    }
};

void setup() {
  Serial.begin(115200);
  delay(2000);  // Aguarda para capturar logs iniciais
  Serial.println("Inicializando...");

  // Conectar ao Wi-Fi
  connectToWiFi();

  // Obter JSON do servidor
  fetchJSON();

  // Configurar BLE
  BLEDevice::init(beaconBLEServerName);
  BLEDevice::setMTU(MTU_SIZE);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE pronto para conexão.");
}

void loop() {
  delay(10);  // Alivia a CPU

  if (deviceConnected) {
    unsigned long now = millis();
    if (now - lastSendTime >= sendInterval) {
      sendChunk();
      lastSendTime = now;
    }

    if (currentOffset >= strlen(jsonBuffer)) {
      Serial.println("JSON enviado completo!");
      currentOffset = 0;  // Reinicia para um novo cliente, se necessário
      delay(1000);
    }
  }

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Propagação BLE reiniciada.");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
    Serial.println("Nova conexão BLE estabelecida.");
  }
}
