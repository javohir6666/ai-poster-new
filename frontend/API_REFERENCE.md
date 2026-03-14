# Backend API Reference (For Custom Backend Implementation)

Bu hujjat sizning o'zingiz yaratadigan backend (Node.js, Django, Go, va h.k) uchun kutilayotgan API endpointlari, request/response formatlari va metodlarini o'z ichiga oladi. Frontend ushbu formatlarga qarab so'rov yuboradi.

## 1. Authentication (Avtorizatsiya)

### 1.1. Login
- **Method:** \`POST\`
- **Endpoint:** \`/api/auth/login\`
- **Request Body:**
  \`\`\`json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  \`\`\`
- **Response (200 OK):**
  \`\`\`json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  \`\`\`

### 1.2. Register
- **Method:** \`POST\`
- **Endpoint:** \`/api/auth/register\`
- **Request Body:**
  \`\`\`json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  \`\`\`
- **Response (201 Created):** *(Same as Login)*

---

## 2. Channels (Kanallar)

Barcha so'rovlar \`Authorization: Bearer <token>\` headeri bilan yuboriladi.

### 2.1. Kanallar ro'yxatini olish
- **Method:** \`GET\`
- **Endpoint:** \`/api/channels\`
- **Response (200 OK):**
  \`\`\`json
  [
    {
      "id": 1,
      "userId": 1,
      "channelUsername": "@my_channel",
      "name": "My Tech Channel",
      "aiModel": "gemini-pro",
      "customPrompt": "Faqat IT haqida yozing",
      "status": "active",
      "isAdminVerified": true
    }
  ]
  \`\`\`

### 2.2. Botni kanalga admin qilinganini tekshirish
Foydalanuvchi botni kanalga admin qilgach, ushbu endpoint orqali tekshiriladi.
- **Method:** \`POST\`
- **Endpoint:** \`/api/channels/verify-admin\`
- **Request Body:**
  \`\`\`json
  {
    "channelUsername": "@my_channel"
  }
  \`\`\`
- **Response (200 OK):**
  \`\`\`json
  {
    "verified": true,
    "channelName": "My Tech Channel",
    "message": "Bot is admin"
  }
  \`\`\`
  *(Agar admin bo'lmasa, \`verified: false\` qaytariladi)*

### 2.3. Kanalni saqlash (Tekshiruvdan so'ng)
- **Method:** \`POST\`
- **Endpoint:** \`/api/channels\`
- **Request Body:**
  \`\`\`json
  {
    "channelUsername": "@my_channel",
    "name": "My Tech Channel",
    "aiModel": "gemini-pro",
    "customPrompt": "Faqat IT haqida yozing"
  }
  \`\`\`
- **Response (201 Created):** *(Qo'shilgan kanal obyekti qaytadi)*

### 2.4. Kanalni o'chirish
- **Method:** \`DELETE\`
- **Endpoint:** \`/api/channels/:id\`
- **Response (200 OK):**
  \`\`\`json
  { "success": true }
  \`\`\`

---

## 3. Analytics (Analitika)

### 3.1. Umumiy Statistika (Overview)
- **Method:** \`GET\`
- **Endpoint:** \`/api/analytics/overview\`
- **Response (200 OK):**
  \`\`\`json
  {
    "totalChannels": 5,
    "activeBots": 5,
    "totalPosts": 1240,
    "aiInteractions": 8500
  }
  \`\`\`

### 3.2. Kanal bo'yicha Statistika
- **Method:** \`GET\`
- **Endpoint:** \`/api/analytics/channels/:channelId\`
- **Response (200 OK):**
  \`\`\`json
  {
    "channelId": 1,
    "postsToday": 5,
    "totalPosts": 150,
    "subscribersGained": 45,
    "aiTokensUsed": 12500,
    "lastPostAt": "2026-03-12T10:00:00Z"
  }
  \`\`\`

---

## 4. Cron Jobs (Avtomatlashtirilgan vazifalar)

### 4.1. Cron Joblar ro'yxati
- **Method:** \`GET\`
- **Endpoint:** \`/api/cron-jobs\`
- **Response (200 OK):**
  \`\`\`json
  [
    {
      "id": 1,
      "channelId": 1,
      "schedule": "0 * * * *",
      "topic": "Texnologiya yangiliklari",
      "status": "active",
      "nextRun": "2026-03-12T11:00:00Z"
    }
  ]
  \`\`\`
