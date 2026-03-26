const axios = require('axios');

// ================= CẤU HÌNH (CONFIGURATION) =================
// 1. URL Server của bạn (Local hoặc Vercel)
const SERVER_URL = process.env.SERVER_URL || 'https://telecom-incident-monitoring-backend.vercel.app';

// 2. API Key Webhook lấy từ backend
const API_KEY = process.env.TELEMETRY_API_KEY || 'default-telemetry-secret-key';

// 3. Chu kỳ bắn lỗi (Mili-giây). VD: 5000 = 5 giây, 1800000 = 30 phút.
const INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '5000', 10);

// 4. ID của Thiết bị (Lấy 1 cái ID trong bảng Device DB)
// Script này được thiết kế để giả lập 1 trạm/thiết bị cố định, giống như 1 Switch ngoài đời thực.
const DEVICE_ID = process.env.DEVICE_ID || '0037306f-502c-4dc4-bb93-131c0f48d1c6';
// ==========================================================

const FAULT_EVENTS = [
  'Fiber Cut (Core Link)',
  'High Temperature Alert',
  'Intermittent Packet Loss',
  'Module Failure (Hardware)',
  'Power Supply Drop'
];

async function shootToRemoteServer() {
  if (DEVICE_ID === 'thay-id-cua-ban-vao-day') {
    console.error('❌ LỖI: Vui lòng thay DEVICE_ID trong file script bằng 1 ID UUID có thật trong DB của bạn.');
    process.exit(1);
  }

  const faultSeverity = Math.floor(Math.random() * 3); // random 0, 1, 2
  const eventType = FAULT_EVENTS[Math.floor(Math.random() * FAULT_EVENTS.length)];

  const payload = {
    deviceId: DEVICE_ID,
    faultSeverity,
    eventTypes: [eventType],
    logs: [
      {
        feature: `Hardware fault detected code ${Math.floor(Math.random() * 9999)}`,
        volume: Math.floor(Math.random() * 10) + 1
      }
    ]
  };

  console.log(`[Remote-Device ${DEVICE_ID}] Đang bắn lỗi "${eventType}" lên Server: ${SERVER_URL}...`);

  try {
    const response = await axios.post(`${SERVER_URL}/api/v1/webhook/telemetry`, payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Thành công! Server phản hồi: HTTP ${response.status} (Incident ID sinh ra: ${response.data.id})`);
  } catch (err) {
    if (err.response) {
      console.error(`❌ Bắn thất bại! Lỗi từ Server: HTTP ${err.response.status}`, err.response.data);
    } else {
      console.error(`❌ Mất kết nối tới Server: ${err.message}`);
    }
  }
}

async function main() {
  console.log('====================================================');
  console.log(`🚀 STANDALONE DEVICE SIMULATOR STARTING...`);
  console.log(`📡 URL Đích: ${SERVER_URL}`);
  console.log(`⚙️ Chu kỳ bắn: Mỗi ${INTERVAL_MS / 1000} giây.`);
  console.log('====================================================\n');

  // Bắn phát đầu tiên ngay lập tức
  await shootToRemoteServer();

  // Bắn lặp lại theo chu kỳ
  setInterval(shootToRemoteServer, INTERVAL_MS);
}

main();
