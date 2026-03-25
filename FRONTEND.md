# Tài liệu API & Tích hợp Frontend (Full Reference)

Tài liệu này cung cấp **đầy đủ** các endpoint, tham số (request) và hình dạng dữ liệu trả về (response JSON) để team Frontend có thể dựa vào đó xây dựng toàn bộ app mà không bắt buộc phải truy cập Swagger lúc code.

## 1. Authentication (Xác thực)

### 1.1. Đăng nhập
- **URL**: `POST /api/v1/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "user",
      "role": "OPERATOR"
    }
  }
  ```

### 1.2. Refresh Token (Gia hạn phiên)
- **URL**: `POST /api/v1/auth/refresh`
- **Body**:
  ```json
  { "refreshToken": "eyJhbGci..." }
  ```
- **Response**: Trả về `accessToken` và `refreshToken` mới y hệt Đăng nhập.

> **Lưu ý**: Ngoại trừ Login, Register và Refresh, tất cả các API phía dưới đều cần đính kèm header:  
> `Authorization: Bearer <accessToken>`

---

## 2. Quản lý Sự cố (Incidents)

### 2.1. Lấy danh sách Sự cố (có phân trang)
- **URL**: `GET /api/v1/incidents?page=1&limit=10`
- **Response (PaginatedResponseDto)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "externalIncidentId": "1234",
        "title": null,
        "description": null,
        "internalStatus": "NEW",
        "importedFaultSeverity": 2,
        "site": { "code": "Location 1" }
      }
    ],
    "meta": {
      "total": 7000,
      "page": 1,
      "limit": 10,
      "totalPages": 700
    }
  }
  ```

### 2.2. Lấy chi tiết 1 Sự cố
- **URL**: `GET /api/v1/incidents/:id`
- **Response**:
  ```json
  {
    "id": "uuid",
    "externalIncidentId": "1234",
    "internalStatus": "NEW",
    "importedFaultSeverity": 2,
    "site": { "code": "Location 1", "address": "...", "region": "..." },
    "events": [{ "eventType": "type 1" }],
    "features": [{ "logFeature": "feature 10", "volume": 5 }],
    "resources": [{ "resourceType": "resource 2" }],
    "severitiesRaw": [{ "severityType": "severity 1" }]
  }
  ```

### 2.3. Cập nhật Trạng thái Xử lý (Reviewing/Resolved)
- **URL**: `PATCH /api/v1/incidents/:id/status`
- **Body**:
  ```json
  {
    "status": "REVIEWING" 
  }
  ```
  *(Các trạng thái hợp lệ: `NEW`, `REVIEWING`, `ACKNOWLEDGED`, `RESOLVED`)*
- **Response**: Trả về Object Incident sau khi cập nhật.

---

## 3. Dashboard Màn Hình Chính

Dashboard cung cấp các API trả về mảng đơn giản để vẽ biểu đồ dễ dàng.

### 3.1. Các Thẻ Tổng Quan (KPI)
- **URL**: `GET /api/v1/dashboard/summary`
- **Response**:
  ```json
  {
    "totalIncidents": 7381,
    "resolvedIncidents": 150,
    "pendingIncidents": 7231,
    "totalSites": 929
  }
  ```

### 3.2. Biểu đồ theo Trạng Thái (Status Pie Chart)
- **URL**: `GET /api/v1/dashboard/by-status`
- **Response**: Dùng để vẽ Bar/Pie Chart.
  ```json
  [
    { "label": "NEW", "value": 7000 },
    { "label": "REVIEWING", "value": 300 }
  ]
  ```

### 3.3. Biểu đồ theo Mức độ Nghiêm trọng (Fault Severity)
- **URL**: `GET /api/v1/dashboard/by-imported-fault-severity`
- **Response**:
  ```json
  [
    { "label": "0", "value": 5000 },
    { "label": "1", "value": 1500 },
    { "label": "2", "value": 881 }
  ]
  ```

*(Ngoài ra có các GET `/by-site`, `/top-event-types`, `/top-resource-types`, `/top-log-features` với cấu trúc trả về `{label: string, value: number}` tương tự)*

---

## 4. Tích hợp Trí tuệ Nhân tạo (AI Analytics)

### 4.1. Lấy kết quả Phân tích cũ (Nếu có)
- **URL**: `GET /api/v1/ai/analysis/:incidentId`
- **Response**: Nếu chưa từng phân tích sẽ sinh mã lỗi `404 Not Found`.
  ```json
  {
    "id": "uuid",
    "category": "Mất kết nối quang",
    "suggestedInternalPriority": "HIGH",
    "shortSummary": "Sự cố liên quan tới cổng Switch bị sập",
    "possibleCause": "Thời tiết bão làm cáp đứt...",
    "suggestedAction": "Cử đội kĩ thuật thay thế thiết bị vùng A",
    "confidence": 0.85
  }
  ```

### 4.2. Yêu cầu AI Generate
- **URL**: `POST /api/v1/ai/analyze/:incidentId`
- **Body**: Không bắt buộc (gọi trống).
- **Lưu ý Frontend**: Action này gọi lên AI Cloud nên chậm (mất 3-5 giây). Frontend bắt buộc phải khoá nút và xoay Loading/Skeleton tránh việc User bấm nhiều lần. Trả về cấu trúc JSON y hệt mụ 4.1 ở trên.

---

## 5. Cấu hình Dữ liệu (Dành cho Role Admin)

### 5.1. Upload File Dữ Liệu
- **URL**: `POST /api/v1/imports/telstra`
- **Header**: Thiết lập thư viện Axios tự tính toán multipart form (không hardcode).
  `Content-Type: multipart/form-data`
- **Body**: Gửi lên array file dưới biến mảng `files` hoặc single file tuỳ cấu trúc FormData:
  ```javascript
  const formData = new FormData();
  formData.append('files', document.getElementById('fileZip').files[0]);
  ```
- **Response**:
  ```json
  {
    "id": "job-uuid",
    "status": "PENDING",
    "sourceSystem": "TELSTRA_CSV"
  }
  ```

---

## 6. Xử lý Lỗi Toàn cục (Global Exception)

Khi call bất kỳ API nào, nếu Token sai, body thiếu tham số, hoăc không tìm thấy dữ liệu, Backend luôn trả về mã lỗi 4xx/5xx với format cực kì nhất quán:

```json
{
  "statusCode": 400,
  "timestamp": "2026-03-25T15:20:00Z",
  "path": "/api/v1/auth/login",
  "message": "Sai mật khẩu hoặc email"
}
```

*Frontend Devs: Ở file `axios.interceptor.ts`, hãy hứng error global và ném `error.response.data.message` vào Thư viện Toast để báo lỗi lên góc màn hình cho sạch sẽ code.*
