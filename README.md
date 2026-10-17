# POS NAM

ระบบขายหน้าร้าน (Point of Sale) สำหรับร้านอาหารและเครื่องดื่ม ใช้บันทึกการขาย จัดการสินค้า ลูกค้า พนักงาน และคลังวัตถุดิบ มีหน้าจอภาษาไทยและรองรับการใช้งานผ่านเว็บ

## ฟีเจอร์หลัก

- ขายสินค้า เลือกตัวเลือกสินค้า และบันทึกวิธีชำระเงิน
- จัดการสินค้า หมวดหมู่ และตัวเลือก เช่น ขนาดหรือท็อปปิง
- จัดการสมาชิกและคะแนนสะสม
- เปิดกะ ปิดกะ และดูประวัติกะ
- จัดการวัตถุดิบ สูตรการผลิต และแจ้งเตือนวัตถุดิบใกล้หมด
- ดูรายการขาย รายงาน และตั้งค่าร้านหรือบัญชีพนักงาน
- แบ่งสิทธิ์ผู้ใช้เป็นพนักงาน ผู้จัดการ และผู้ดูแลระบบ

## เทคโนโลยี

- Frontend: React, TypeScript และ Vite (`client/`)
- Backend: Node.js, Express, TypeScript และ Sequelize (`backend/`)
- Database: PostgreSQL
- Deploy: Docker/Render สำหรับ API, Vercel สำหรับเว็บ และ Supabase สำหรับฐานข้อมูล

## ทดลองใช้งานบนเครื่อง

### สิ่งที่ต้องติดตั้ง

- Node.js รุ่น 22 ขึ้นไป และ npm
- Docker Desktop (ใช้รัน PostgreSQL ด้วย Docker Compose)

### 1. เตรียมฐานข้อมูล

จากโฟลเดอร์หลักของโปรเจกต์ ให้สร้างไฟล์ `.env` จากตัวอย่าง:

```powershell
Copy-Item .env.example .env
```

เปิด `.env` และกำหนดรหัสผ่าน PostgreSQL กับ pgAdmin จากนั้นเริ่มฐานข้อมูล:

```powershell
docker compose up -d postgres
```

ข้อมูลฐานข้อมูลจะถูกเก็บใน `volumes/postgres_data` เพื่อให้ยังอยู่เมื่อปิด container

### 2. ตั้งค่าและเปิด API

```powershell
Copy-Item backend/.env.example backend/.env
```

แก้ `backend/.env` ให้ `DB_PASSWORD` ตรงกับ `POSTGRES_PASSWORD` ในไฟล์ `.env` ที่โฟลเดอร์หลัก แล้วรัน:

```powershell
cd backend
npm ci
npm run dev
```

API จะทำงานที่ `http://localhost:3000`. ตรวจสอบได้ที่ `http://localhost:3000/health` ซึ่งควรตอบ `{"status":"ok"}`.

### 3. เปิดหน้าเว็บ

เปิด terminal อีกหน้าต่าง จากโฟลเดอร์หลัก:

```powershell
cd client
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติคือ `http://localhost:5173`). ในโหมดพัฒนา Vite จะส่งคำขอ `/api` ไปยัง backend ที่ `localhost:3000` ให้อัตโนมัติ

### บัญชีตัวอย่าง

ฐานข้อมูลใหม่จะถูกเติมข้อมูลตัวอย่างเมื่อ backend เริ่มทำงาน:

| บทบาท | PIN |
| --- | --- |
| พนักงาน | `1234` |
| ผู้จัดการ | `2222` |
| ผู้ดูแลระบบ | `9999` |

PIN เหล่านี้มีไว้สำหรับทดลองเท่านั้น ควรเปลี่ยนหรือลบบัญชีตัวอย่างก่อนเปิดให้ใช้งานจริง

## ใช้ pgAdmin (ไม่บังคับ)

หากต้องการจัดการฐานข้อมูลผ่านหน้าเว็บ ให้เริ่ม service เพิ่ม:

```powershell
docker compose up -d pgadmin
```

เข้า `http://localhost:5050` แล้วใช้ email และรหัสผ่านจาก `.env` ของโฟลเดอร์หลัก เพิ่ม server โดยกำหนด Host เป็น `postgres`, Port `5432`, Maintenance database เป็นค่าของ `POSTGRES_DB` และ Username/Password ตามค่าที่ตั้งไว้ใน `.env`

## Deploy

คู่มือ deploy แยกตามแพลตฟอร์มอยู่ที่ [DEPLOY.md](DEPLOY.md):

1. สร้าง PostgreSQL project บน Supabase และคัดลอก connection string
2. Deploy API ด้วย Docker บน Render แล้วตั้ง `DATABASE_URL`, `SESSION_SECRET` และ `CORS_ORIGINS`
3. Deploy `client/` บน Vercel แล้วตั้ง `VITE_API_URL` เป็น URL ของ Render ที่ลงท้ายด้วย `/api`

ค่า `DATABASE_URL` และ secret ต้องตั้งใน environment variables ของบริการ ห้ามใส่รหัสผ่านหรือ secret จริงลงใน repository

## คำสั่งที่ใช้บ่อย

```sh
# Backend (จาก backend/)
npm run dev       # เริ่ม API สำหรับพัฒนา
npm run build     # คอมไพล์ TypeScript
npm start         # เริ่ม API ที่ build แล้ว

# Frontend (จาก client/)
npm run dev       # เริ่ม Vite สำหรับพัฒนา
npm run build     # ตรวจ TypeScript และ build เว็บ
```

## โครงสร้างโปรเจกต์

```text
backend/          API, models, routes และ seed data
client/           เว็บแอป React
backup_sql/       ไฟล์ SQL สำรอง/ข้อมูลฐานข้อมูลเดิม
volumes/          ข้อมูล PostgreSQL ที่ Docker Compose เก็บไว้ในเครื่อง
Dockerfile        ภาพ Docker สำหรับ backend API
render.yaml       Blueprint สำหรับ Render
DEPLOY.md         คู่มือ deploy แบบละเอียด
```

## การช่วยพัฒนา

สามารถ fork repository แล้วทดลองปรับแต่งได้ ก่อนเปิดรับคำสั่งขายจริง โปรดเปลี่ยน PIN เริ่มต้น ตั้ง `SESSION_SECRET` ที่สุ่มและคาดเดายาก และใช้ฐานข้อมูลที่มีการสำรองข้อมูล
