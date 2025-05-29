#include <HardwareSerial.h>
#include <esp_now.h>
#include <WiFi.h>
#include <TFT_eSPI.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>  

#include "QRCodeGenerator.h"  //ไลบรารีสำหรับสร้าง QR Code

QRCode qrcode;

//--------------------- WiFi & Server-----------------------------
const char* ssid = "KKIMM";
const char* password = "12345678";
const char* serverUrl = "https://web-bottles-redeem-reward.up.railway.app/api/esp-request-token";


const char* lineToken = "ve7PqXRvhn4ZLYhVjfECjiB69DAALv6AaTDDINiJX1e";  // URL สื่อสารกับ LINE

//------------------- TFT Display & Touch-------------------
#define TFT_WIDTH 320
#define TFT_HEIGHT 480
#define TOUCH_CS 16
TFT_eSPI tft = TFT_eSPI();

#define BTN_WIDTH 100
#define BTN_HEIGHT 40

//กำหนดตำแหน่งของปุ่ม
#define BTN_SEND_X 110
#define BTN_SEND_Y 360

#define BTN_START_X 20
#define BTN_START_Y 300

#define BTN_TRY_X 200
#define BTN_TRY_Y 300

#define BTN_BACK_X 110
#define BTN_BACK_Y 430

// ข้อมูลคาลิเบรตหน้าจอสัมผัส
uint16_t calData[5] = { 288, 3470, 298, 3526, 5 };

// Ultrasonic Sensor
#define TRIG_PIN 26
#define ECHO_PIN 27
const int ULTRASONIC_THRESHOLD = 10;

String message_status;

// ตัวแปรสำหรับเก็บข้อมูลที่รับเข้ามา (ESP32-CAM)
String currentLabel = "Wiat receiving";
int countPETbig = 0;
int countPETsmall = 0;
int countOther = 0;
bool newDataReceived = false;


// เพิ่มตัวแปรสำหรับตรวจสอบการเชื่อมต่อ
unsigned long lastHeartbeatTime = 0;
const unsigned long CONNECTION_TIMEOUT = 10000;  // 10 วินาที timeout
bool connectESPcam = false;
// สถานะว่าถูกหรือไม่
bool correct = false;
bool incorrect = false;


// UART สำหรับรับข้อมูลจาก ESP32-CAM
HardwareSerial mySerial(2);  // ใช้ Serial2 (UART2)

// สร้าง Semaphore สำหรับป้องกันการเข้าถึงข้อมูลพร้อมกัน
SemaphoreHandle_t dataMutex;


// ฟังก์ชันแสดงผลปุ่ม
void drawButton(int x, int y, const char* label, uint16_t color) {
  // วาดปุ่ม
  tft.fillRect(x, y, BTN_WIDTH, BTN_HEIGHT, color);
  tft.drawRect(x, y, BTN_WIDTH, BTN_HEIGHT, TFT_WHITE);

  // ตั้งค่าสีและขนาดตัวอักษร
  tft.setTextColor(TFT_WHITE);  // , TFT_BLUE
  tft.setTextSize(2);

  // คำนวณตำแหน่งตรงกลางของข้อความ
  int textWidth = strlen(label) * 12;  // คำนวณจากขนาดตัวอักษร (ประมาณ 12 px ต่ออักษรที่ TextSize 2)
  int textHeight = 16;                 // ประมาณค่าความสูงของตัวอักษรที่ TextSize 2
  int textX = x + (BTN_WIDTH - textWidth) / 2;
  int textY = y + (BTN_HEIGHT - textHeight) / 2;

  // แสดงข้อความ
  tft.setCursor(textX, textY);
  tft.print(label);
}

void drawAllButtons() {
  drawButton(BTN_SEND_X, BTN_SEND_Y, "Send", TFT_BLUE);
  drawButton(BTN_START_X, BTN_START_Y, "Start", TFT_GREEN);
  drawButton(BTN_TRY_X, BTN_TRY_Y, "Again", TFT_YELLOW);
}

// ฟังก์ชันแสดงข้อความสถานะ
void updateStatus(String message, uint16_t color) {
  tft.fillRect(20, 280, 280, 30, TFT_BLACK);
  tft.setTextColor(color, TFT_BLACK);
  tft.setCursor(20, 280);
  tft.print(message);
}
// ฟังก์ชันสำหรับปุ่ม Send
void handleSendButton() {
  Serial.println("Send Button Pressed!");

  // เปลี่ยนสีปุ่มเป็นสีเทาแสดงว่ากำลังทำงาน
  tft.fillRect(BTN_SEND_X, BTN_SEND_Y, BTN_WIDTH, BTN_HEIGHT, TFT_DARKGREY);
  tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
  tft.setTextSize(2);
  tft.setCursor(BTN_SEND_X + 20, BTN_SEND_Y + 15);
  tft.print("Sending...");


  generateQRCode(countPETbig, countPETsmall);
}

// ฟังก์ชันสำหรับปุ่ม Start
void handleStartButton() {
  Serial.println("Start Button Pressed!");

  // เปลี่ยนสีปุ่มเป็นสีเทาแสดงว่ากำลังทำงาน
  tft.fillRect(BTN_START_X, BTN_START_Y, BTN_WIDTH, BTN_HEIGHT, TFT_DARKGREY);
  tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
  tft.setTextSize(2);
  tft.setCursor(BTN_START_X + 20, BTN_START_Y + 15);
  tft.print("Start");

  mySerial.println("Start");
  delay(500);

  drawButton(BTN_START_X, BTN_START_Y, "Start", TFT_GREEN);
}

// ฟังก์ชันสำหรับปุ่ม Try Again
void handleTryAgainButton() {
  Serial.println("Try Again Button Pressed!");

  // ลบข้อความจากหน้าจอ
  tft.fillRect(150 - 40, 230 - 10, 100, 20, TFT_BLACK);
  message_status = "";  // เคลียร์ข้อความ

  // เปลี่ยนสีปุ่มเป็นสีเทาแสดงว่ากำลังทำงาน
  tft.fillRect(BTN_TRY_X, BTN_TRY_Y, BTN_WIDTH, BTN_HEIGHT, TFT_DARKGREY);
  tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
  tft.setTextSize(2);
  tft.setCursor(BTN_TRY_X + 20, BTN_TRY_Y + 15);
  tft.print("Again");

  mySerial.println("Try again");
  delay(500);

  drawButton(BTN_TRY_X, BTN_TRY_Y, "Again", TFT_YELLOW);
}

void handleBackButton() {
  Serial.println("Back Button Pressed!");

  // เปลี่ยนสีปุ่มเป็นสีเทาแสดงว่ากำลังทำงาน
  tft.fillRect(BTN_BACK_X, BTN_BACK_Y, BTN_WIDTH, BTN_HEIGHT, TFT_DARKGREY);
  tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
  tft.setTextSize(2);
  tft.setCursor(BTN_BACK_X + 20, BTN_BACK_Y + 15);
  tft.print("Back");

  // รีเซ็ตค่าตัวแปรที่เกี่ยวข้อง
  countPETbig = countPETsmall = countOther = 0;

  // กลับไปหน้าหลัก
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.println("PET bottle sorting system");

  // แสดงข้อมูลและสถานะการเชื่อมต่อ
  updateDisplay();
  drawAllButtons();
}


// ฟังก์ชันตรวจจับการสัมผัส
void checkTouch() {
  uint16_t x, y;
  if (tft.getTouch(&x, &y)) {
    Serial.printf("Touch detected at: X=%d, Y=%d\n", x, y);

    // แปลงค่าพิกัดสัมผัสให้ตรงกับหน้าจอ
    uint16_t screenX = map(x, 200, 3800, 0, TFT_WIDTH);   // แปลงค่า X
    uint16_t screenY = map(y, 200, 3800, 0, TFT_HEIGHT);  // แปลงค่า Y

    Serial.printf("Raw Touch: X=%d, Y=%d => Mapped: X=%d, Y=%d\n", x, y, screenX, screenY);
    // ใช้ค่าที่แปลงแล้วในการตรวจสอบปุ่มกด
    if (screenX > 50 && screenX < 150 && screenY > 100 && screenY < 200) {
      Serial.println("Button Pressed!");
    }

    // ตรวจสอบว่ากดปุ่มไหน แล้วเรียกฟังก์ชันที่เกี่ยวข้อง
    if (x > BTN_SEND_X && x < (BTN_SEND_X + BTN_WIDTH) && y > BTN_SEND_Y && y < (BTN_SEND_Y + BTN_HEIGHT)) {
      handleSendButton();
    } else if (x > BTN_START_X && x < (BTN_START_X + BTN_WIDTH) && y > BTN_START_Y && y < (BTN_START_Y + BTN_HEIGHT)) {
      handleStartButton();
    } else if (x > BTN_TRY_X && x < (BTN_TRY_X + BTN_WIDTH) && y > BTN_TRY_Y && y < (BTN_TRY_Y + BTN_HEIGHT)) {
      handleTryAgainButton();
    } else if (x > BTN_BACK_X && x < (BTN_BACK_X + BTN_WIDTH) && y > BTN_BACK_Y && y < (BTN_BACK_Y + BTN_HEIGHT)) {
      handleBackButton();
    }
  }
}


String requestToken() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int code = http.POST("{}");
    if (code > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);

      int tokenStart = response.indexOf(":\"") + 2;
      int tokenEnd = response.indexOf("\",");
      return response.substring(tokenStart, tokenEnd);
    } else {
      Serial.println("Failed to get token.");
    }
    http.end();
  }
  return "";
}

// ฟังก์ชันสร้าง QR Code จาก Token
void generateQRCode(int countPETbig, int countPETsmall) {
  String token = requestToken();
  if (token.length() > 0) {

    String qrData = "token:" + token + ";" + "small:" + String(countPETsmall) + ";" + "big:" + String(countPETbig);

    // เคลียร์หน้าจอ
    tft.fillScreen(TFT_WHITE);
    tft.setTextColor(TFT_BLACK);
    tft.setTextSize(2);
    tft.setCursor(10, 10);
    tft.println("Scan QR Code");

    // สร้าง QR Code
    uint8_t qrcodeData[qrcode_getBufferSize(3)];
    qrcode_initText(&qrcode, qrcodeData, 3, 0, qrData.c_str());

    int qrSize = qrcode.size;  // ขนาด QR Code (เช่น 21x21)
    int scale = 5;             // ขยายให้ใหญ่ขึ้น (pixel size)
    int xOffset = (tft.width() - qrSize * scale) / 2;
    int yOffset = (tft.height() - qrSize * scale) / 2;

    // วาด QR Code ลงจอ TFT
    for (int y = 0; y < qrSize; y++) {
      for (int x = 0; x < qrSize; x++) {
        if (qrcode_getModule(&qrcode, x, y)) {
          tft.fillRect(xOffset + x * scale, yOffset + y * scale, scale, scale, TFT_BLACK);
        }
      }
    }

    Serial.println("QR Code Updated: " + qrData);
    // **วาดปุ่ม Back**
    drawButton(BTN_BACK_X, BTN_BACK_Y, "Back", TFT_RED);
  }
}


// ฟังก์ชันแจ้งเตือน LINE
void sendLineNotify() {
  HTTPClient http;
  http.begin("https://web-bottles-redeem-reward.up.railway.app/api/routers/lineNotify");
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST("{\"message\": \"ขวดเต็มแล้ว\"}");
  http.end();  // <== สำคัญมาก

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
}

// อ่านค่าจาก Ultrasonic Sensor
int getUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout 30ms

  if (duration == 0) {
    Serial.println("ไม่พบสัญญาณ ECHO หรือ timeout");
    return -1;
  }

  int distance = duration * 0.034 / 2;
  return distance;
}
// ตัวแปรป้องกันการแจ้งเตือนซ้ำ
bool isNotified = false;

void Task1(void* pvParameters) {
  while (true) {
    int distance = getUltrasonicDistance();
    Serial.print("Ultrasonic Distance: ");
    Serial.println(distance);

    if (distance <= ULTRASONIC_THRESHOLD && !isNotified) {
      sendLineNotify();
      isNotified = true;  // ป้องกันการแจ้งเตือนซ้ำ
    } else if (distance > ULTRASONIC_THRESHOLD) {
      isNotified = false;  // รีเซ็ตเมื่อวัตถุออกจากระยะ
    }

    vTaskDelay(500 / portTICK_PERIOD_MS);
  }
}


// Task2: อัปเดตค่าบนหน้าจอ
// ตัวแปรเก็บค่าก่อนหน้า
int prevPETbig = -1;
int prevPETsmall = -1;
#define TEXT_SIZE_TITLE 3
#define TEXT_SIZE_CONTENT 2

void Task2(void* pvParameters) {
  while (true) {
    if (xSemaphoreTake(dataMutex, portMAX_DELAY) == pdTRUE) {

      // ตรวจสอบว่ามีข้อมูลใหม่และค่ามีการเปลี่ยนแปลงหรือไม่
      if (newDataReceived && (countPETbig != prevPETbig || countPETsmall != prevPETsmall)) {

        updateDisplay();   // อัปเดตหน้าจอ
        drawAllButtons();  // วาดปุ่มใหม่

        // อัปเดตค่าก่อนหน้า
        prevPETbig = countPETbig;
        prevPETsmall = countPETsmall;
        newDataReceived = false;
      }

      xSemaphoreGive(dataMutex);
    }

    vTaskDelay(200 / portTICK_PERIOD_MS);  // ลดภาระของ CPU
  }
}

// ฟังก์ชันอัปเดตค่าบนหน้าจอ
void updateDisplay() {
  tft.fillRect(0, 50, TFT_WIDTH, 300, TFT_BLACK);  // ลบข้อมูลเก่า

  // แสดงข้อความ "Detect: [label]"
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setTextSize(TEXT_SIZE_TITLE);
  tft.setCursor(40, 80);
  tft.print("Detect: ");
  tft.println(currentLabel);

  // แสดงค่า PETbig, PETsmall, Other
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(TEXT_SIZE_CONTENT);
  tft.setCursor(40, 120);
  tft.print("PETbig: ");
  tft.println(countPETbig);

  tft.setCursor(40, 150);
  tft.print("PETsmall: ");
  tft.println(countPETsmall);

  tft.setCursor(40, 180);
  tft.print("ESP32-CAM: ");
  // ไฟแสดงผล
  if (connectESPcam) {
    tft.fillCircle(200, 190, 10, TFT_GREEN);  // วาดวงกลมสีเขียวที่พิกัด (200, 190) ถ้าเชื่อมต่อ
  } else {
    tft.fillCircle(200, 190, 10, TFT_DARKGREY);  // วาดวงกลมสีเทาถ้ายังไม่เชื่อมต่อ
  }

  // ลบข้อความสถานะเก่าก่อนวาดใหม่
  tft.fillRect(40, 210, 100, 20, TFT_BLACK);  // เคลียร์ข้อความเก่า

  if (correct) {
    tft.setCursor(40, 220);                  // ตั้งตำแหน่งข้อความ
    tft.setTextColor(TFT_GREEN, TFT_BLACK);  // กำหนดสีของข้อความ
    tft.print("Correct");                    // แสดงข้อความ
  } else if (incorrect) {
    tft.setCursor(40, 220);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.print("Incorrect");
  }
}





// Task3: อ่านข้อมูลจาก Serial
void Task3(void* pvParameters) {
  while (true) {
    if (mySerial.available()) {
      String receivedLabel = mySerial.readStringUntil('\n');
      receivedLabel.trim();  // ลบช่องว่างหรือตัวอักษรขึ้นบรรทัดใหม่

      Serial.print("Received Label: ");
      Serial.println(receivedLabel);

      // อัปเดตเวลาที่ได้รับข้อมูลล่าสุด
      lastHeartbeatTime = millis();

      // ใช้ Semaphore เพื่อล็อคข้อมูลระหว่างเขียน
      if (xSemaphoreTake(dataMutex, portMAX_DELAY) == pdTRUE) {
        // อัปเดตตัวแปรตามข้อมูลที่ได้รับ
        currentLabel = receivedLabel;

        if (receivedLabel == "PETbig") {
          countPETbig++;
          Serial.println("Detected a big PET bottle!");
        } else if (receivedLabel == "PETsmall") {
          countPETsmall++;
          Serial.println("Detected a small PET bottle!");
        } else if (receivedLabel == "NoPET") {
          countOther++;
          Serial.println("Detected non-PET object!");
        } else if (receivedLabel == "connect") {
          connectESPcam = true;  // ตั้งค่าเป็น true เมื่อตรวจพบการเชื่อมต่อ
          Serial.print("ESP32-cam connect success");
        } else if (receivedLabel == "correct") {
          correct = true;  // ตั้งค่าเป็น true เมื่อตรวจพบขวด
          // message_status = "Correct";
          Serial.print("Bottle correct");
        } else if (receivedLabel == "incorrect") {
          incorrect = true;  // ตั้งค่าเป็น true เมื่อตรวจพบขวด
          // message_status = "Incorrect";
          Serial.print("Bottle incorrect");
        }

        newDataReceived = true;     // บอกว่ามีข้อมูลใหม่
        xSemaphoreGive(dataMutex);  // ปล่อย Semaphore
      }
    }

    // ตรวจสอบหากไม่ได้รับข้อมูลเป็นเวลานาน
    if (millis() - lastHeartbeatTime > CONNECTION_TIMEOUT) {
      if (connectESPcam) {  // เช็คว่าปัจจุบันเชื่อมต่ออยู่หรือไม่ก่อนเปลี่ยนสถานะ
        if (xSemaphoreTake(dataMutex, portMAX_DELAY) == pdTRUE) {
          connectESPcam = false;
          currentLabel = "Connection lost";
          newDataReceived = true;
          Serial.println("ESP32-CAM connection timeout!");
          xSemaphoreGive(dataMutex);
        }
      }
    }

    vTaskDelay(10 / portTICK_PERIOD_MS);  // ตรวจสอบบ่อยๆ เพื่อไม่ให้พลาดข้อมูล
  }
}


// เพิ่มฟังก์ชันเพื่อส่งคำขอข้อมูลสถานะ (heartbeat request) ไปยัง ESP32-CAM
void requestHeartbeat() {
  mySerial.println("status");  // ส่งคำขอสถานะไปยัง ESP32-CAM
  Serial.println("Requesting heartbeat from ESP32-CAM");
}

// สร้าง Task ใหม่เพื่อส่งคำขอ heartbeat เป็นระยะๆ
void Task4(void* pvParameters) {
  while (true) {
    requestHeartbeat();
    vTaskDelay(5000 / portTICK_PERIOD_MS);  // ส่งคำขอทุกๆ 5 วินาที
  }
}

void setup() {
  Serial.begin(115200);

  // สร้าง Semaphore
  dataMutex = xSemaphoreCreateMutex();

  // เริ่มต้น Serial สำหรับการสื่อสารกับ ESP32-CAM
  // เปลี่ยนขา GPIO ตามที่คุณเชื่อมต่อจริง
  mySerial.begin(115200, SERIAL_8N1, 3, 1);  // RX=GPIO16, TX=GPIO17 ต่อกับ 15 , 12  เขียว-rx  เหลื่อง-tx 

  // ตั้งค่าขา Ultrasonic
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  //LINE.setToken(lineToken);

  // ตั้งค่าจอ TFT
  tft.init();
  tft.setRotation(0);
  tft.setTouch(calData);  // ใช้ค่าคาลิเบรต
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.println("PET bottle sorting system");
  tft.setCursor(20, 50);
  tft.println("Connected to WiFi...");

  // เริ่มต้น Touch Screen
  //ts.begin();
  //ts.setRotation(1);

  // เชื่อมต่อ WiFi
  WiFi.begin(ssid, password);
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    tft.setCursor(20, 50);
    tft.fillRect(20, 50, 400, 25, TFT_BLACK);
    tft.println("WiFi: Connected!");
  } else {
    Serial.println("\nWiFi Connection Failed!");
    tft.setCursor(20, 50);
    tft.fillRect(20, 50, 400, 25, TFT_BLACK);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.println("WiFi: Not connected!");
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
  }


  // แสดงข้อมูลเริ่มต้น
  tft.setCursor(40, 80);
  tft.setTextSize(2);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.print("Detect: ");
  tft.println(currentLabel);

  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(40, 120);
  tft.print("PETbig: ");
  tft.println(countPETbig);

  tft.setCursor(40, 150);
  tft.print("PETsmall: ");
  tft.println(countPETsmall);

  tft.setCursor(40, 180);
  tft.print("ESP32-CAM: ");


  drawAllButtons();

  Serial.println("ESP32 Ready to receive data...");

  // สร้าง Tasks
  xTaskCreatePinnedToCore(Task1, "UltrasonicTask", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(Task2, "DisplayTask", 4096, NULL, 2, NULL, 1);
  xTaskCreatePinnedToCore(Task3, "SerialReadTask", 4096, NULL, 3, NULL, 1);
  xTaskCreatePinnedToCore(Task4, "HeartbeatTask", 2048, NULL, 1, NULL, 0);
}

void loop() {
  // ใช้สำหรับตรวจสอบการแตะที่หน้าจอ
  checkTouch();
  delay(50);  // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ CPU ทำงานหนักเกินไป
}