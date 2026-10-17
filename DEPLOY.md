# Deploy POS NAM

แอปนี้แบ่งเป็น 3 ส่วน: PostgreSQL ใช้ Supabase, API ใช้ Render (Docker) และหน้าเว็บใช้ Vercel

## 1. เตรียมฐานข้อมูล Supabase

1. สร้าง Supabase project แล้วเปิด **Project Settings → Database → Connection string**.
2. เลือก URI connection string และใช้ค่าที่เหมาะกับ backend บน Render (ถ้าใช้ direct connection ให้ Render รองรับ IPv6; ถ้าไม่แน่ใจให้ใช้ Supavisor session pooler).
3. เก็บ URI ไว้เป็นความลับและแทนรหัสผ่านที่อยู่ในวงเล็บ.

Backend ใช้ `DATABASE_URL` และเปิด TLS ให้อัตโนมัติ (`DB_SSL=false` ใช้เฉพาะฐานข้อมูล local ที่ไม่รองรับ TLS) จากนั้น Sequelize จะสร้าง/ปรับ schema และเพิ่มข้อมูลเริ่มต้นเมื่อเริ่มทำงานครั้งแรก

## 2. Deploy API บน Render

1. เชื่อม repository กับ Render แล้วสร้าง Blueprint จาก `render.yaml` หรือสร้าง **Web Service → Docker** โดยใช้ root directory ของ repository.
2. กำหนด environment variables:
   - `DATABASE_URL`: URI จาก Supabase
   - `CORS_ORIGINS`: URL ของเว็บ Vercel เช่น `https://pos-nam.vercel.app` (ถ้ามีหลาย URL ให้คั่นด้วย comma)
   - `SESSION_SECRET`: สุ่ม secret ยาวอย่างน้อย 32 ตัวอักษร
3. Deploy แล้วตรวจ `https://<render-api-domain>/health` ต้องตอบ `{"status":"ok"}`.

อย่าตั้ง `DB_SSL=false` บน production ที่ใช้ Supabase

## 3. Deploy หน้าเว็บบน Vercel

1. Import repository ใน Vercel แล้วตั้ง **Root Directory** เป็น `client`.
2. Framework: Vite; Build command: `npm run build`; Output directory: `dist`.
3. ตั้ง `VITE_API_URL` เป็น `https://<render-api-domain>/api`.
4. Deploy แล้วนำโดเมน Vercel ไปใส่ใน `CORS_ORIGINS` ของ Render จากนั้น redeploy/restart API.

`client/vercel.json` ตั้ง rewrite ให้ URL ของหน้า React ทำงานเมื่อ refresh หน้าย่อย

## Deploy API ด้วย Docker ในเครื่อง

```sh
docker build -t pos-nam-api .
docker run --rm -p 3000:3000 --env-file backend/.env pos-nam-api
```

ควรมี `DATABASE_URL` หรือค่า `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` และ `SESSION_SECRET` ใน env file

## หมายเหตุด้านข้อมูลเริ่มต้น

`backend/src/seed.ts` เพิ่มบัญชีตัวอย่าง PIN `9999`, `2222`, `1234` เมื่อเริ่มระบบ และไม่ได้เปลี่ยน PIN ของบัญชีที่มีอยู่แล้ว ให้เปลี่ยน PIN ทันทีหลัง deploy และตรวจ `SESSION_SECRET` ว่าตั้งค่าแล้วก่อนเปิดใช้งานจริง
