#include <Adafruit_GFX.h>    // Biblioteca gráfica
#include <Adafruit_TFTLCD.h> // Biblioteca para o TFT LCD
#include <SD.h>              // Biblioteca para manipulação do cartão SD
#include <SPI.h>             // Biblioteca SPI para comunicação com SD

// Definições de pinos para o Arduino Uno com shield LCD 2.4"
#define LCD_CS A3    // Chip Select
#define LCD_CD A2    // Command/Data
#define LCD_WR A1    // LCD Write
#define LCD_RD A0    // LCD Read
#define LCD_RESET A4 // Reset

#define SD_CS 10 // Pino CS do cartão SD (pino 10 para shields TFT comuns)

// Definição manual das cores (RGB565)
#define BLACK   0x0000
#define WHITE   0xFFFF

// Criação do objeto TFT
Adafruit_TFTLCD tft(LCD_CS, LCD_CD, LCD_WR, LCD_RD, LCD_RESET);

// Função para carregar imagens BMP de 16 bits do cartão SD
void drawBMP16(const char *filename, int x, int y) {
  File bmpFile;
  int bmpWidth, bmpHeight;
  uint8_t bmpDepth;
  uint32_t bmpImageoffset;
  uint16_t rowBuffer[240]; // Buffer para armazenar uma linha da imagem

  // Abre o arquivo BMP
  bmpFile = SD.open(filename);
  if (!bmpFile) {
    Serial.println("Erro: Imagem nao encontrada no SD!");
    return;
  }

  // Verifica se é um arquivo BMP válido
  if (read16(bmpFile) != 0x4D42) {
    Serial.println("Erro: Arquivo nao e um BMP valido!");
    bmpFile.close();
    return;
  }

  // Pula informações desnecessárias
  (void)read32(bmpFile);
  bmpImageoffset = read32(bmpFile); 
  (void)read32(bmpFile); 
  bmpWidth = read32(bmpFile);
  bmpHeight = read32(bmpFile);
  
  // Verifica a profundidade de cor
  if (read16(bmpFile) != 1 || (bmpDepth = read16(bmpFile)) != 16) {
    Serial.println("Erro: BMP deve ser de 16 bits!");
    bmpFile.close();
    return;
  }

  // Configura a tela para receber pixels
  tft.setAddrWindow(x, y, x + bmpWidth - 1, y + bmpHeight - 1);

  // Move o ponteiro do arquivo para os dados da imagem
  bmpFile.seek(bmpImageoffset);

  // Desenha a imagem linha por linha
  for (int row = 0; row < bmpHeight; row++) {
    for (int col = 0; col < bmpWidth; col++) {
      rowBuffer[col] = read16(bmpFile); // Lê diretamente como RGB565
    }
    tft.drawRGBBitmap(x, y + (bmpHeight - 1 - row), rowBuffer, bmpWidth, 1);
  }

  bmpFile.close();
  Serial.println("Imagem exibida com sucesso!");
}

// Função para ler um inteiro de 16 bits de um arquivo BMP
uint16_t read16(File &f) {
  uint16_t result;
  f.read((uint8_t *)&result, 2);
  return result;
}

// Função para ler um inteiro de 32 bits de um arquivo BMP
uint32_t read32(File &f) {
  uint32_t result;
  f.read((uint8_t *)&result, 4);
  return result;
}

void setup() {
  Serial.begin(9600);
  
  // Inicializa a tela TFT
  tft.reset();
  tft.begin(0x9341); // Driver do LCD (ILI9341)
  tft.setRotation(1);
  tft.fillScreen(BLACK);
  
  // Inicializa o cartão SD
  Serial.print("Inicializando o SD...");
  if (!SD.begin(SD_CS)) {
    Serial.println("Falha ao acessar o SD!");
    tft.setTextColor(WHITE);
    tft.setTextSize(2);
    tft.setCursor(10, 20);
    tft.print("Erro no SD!");
    return;
  }
  Serial.println("SD detectado!");

  // Exibe a logomarca do SENAC (deve estar no SD como "senac.bmp")
  drawBMP16("senac.bmp", 60, 10);

  // Exibe a mensagem de boas-vindas
  tft.setTextColor(WHITE);
  tft.setTextSize(2);

  tft.setCursor(10, 80);
  tft.print("Seja Bem Vinda Larissa");

  tft.setCursor(10, 120);
  tft.print("Sua aula de hoje sera");

  tft.setCursor(10, 160);
  tft.print("no 14 Andar, Sala 1405");

  tft.setCursor(10, 200);
  tft.print("com o Professor Marinho");

  tft.setCursor(10, 240);
  tft.print("Aula de IA Generativa");
}

void loop() {
  // Nenhuma ação contínua necessária
}
