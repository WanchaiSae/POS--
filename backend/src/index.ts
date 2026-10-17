import express, { Request, Response } from "express";
import { DataTypes } from "sequelize";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/users";
import sequelize from "./config/database";
import productRoutes from "./routes/product";
import categoryRoutes from "./routes/category";
import customerRoutes from "./routes/customer";
import productOptionRoutes from "./routes/productOption";
import shiftRoutes from "./routes/shift";
import orderRoutes from "./routes/order";
import orderItemRoutes from "./routes/orderItem";
import orderItemOptionRoutes from "./routes/orderItemOption";
import ingredientRoutes from "./routes/ingredient";
import recipeIngredientRoutes from "./routes/recipeIngredient";
import pointLogRoutes from "./routes/pointLog";
import settingsRoutes from "./routes/settings";
import seedDatabase from "./seed";
import { getSessionUser } from "./utils/session";
import "./model/User";
import "./model/Categorie";
import "./model/Product";
import "./model/ProductOption";
import "./model/Customer";
import "./model/Shift";
import "./model/Order";
import "./model/OrderItem";
import "./model/OrderItemOption";
import "./model/Ingredient";
import "./model/RecipeIngredient";
import "./model/PointLog";
import "./model/AppSetting";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Backfill timestamp columns before Sequelize's alter sync. Existing rows have
// no value for newly added NOT NULL columns, so sync alone cannot add them.
const migrateInventoryTimestamps = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tables = ["ingredients", "recipe_ingredients"];

  for (const table of tables) {
    if (!(await queryInterface.tableExists(table))) continue;

    const columns = await queryInterface.describeTable(table);
    if (!columns.last_updated_at) {
      await queryInterface.addColumn(table, "last_updated_at", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    await sequelize.query(
      `UPDATE "${table}" SET "last_updated_at" = NOW() WHERE "last_updated_at" IS NULL`,
    );
    await queryInterface.changeColumn(table, "last_updated_at", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });
  }
};

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "32kb", strict: true }));

// All API routes require an active signed-in user except the PIN login endpoint.
app.use("/api", async (req, res, next) => {
  if (req.method === "POST" && req.path === "/users/login") return next();
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบใหม่" });
    res.locals.user = user;
    return next();
  } catch (error) {
    console.error("API authentication failed:", error);
    return res.status(500).json({ success: false, message: "ตรวจสอบสิทธิ์ไม่สำเร็จ" });
  }
});

// API route ����Ѻ���ͺ���ͧ��
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "POS API is running with TypeScript & Sequelize!" });
});
app.get("/health", (_req: Request, res: Response) => res.status(200).json({ status: "ok" }));
// ��ҹ User Routes (�ء Endpoint 㹹��Т�鹵鹴��� /api/users)
app.use("/api/users", userRoutes);
// ��ҹ Product Routes (�ء Endpoint 㹹��Т�鹵鹴��� /api/products)
app.use("/api/products", productRoutes);
// ��ҹ Category Routes (�ء Endpoint 㹹��Т�鹵鹴��� /api/categories)
app.use("/api/categories", categoryRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/product-options", productOptionRoutes);

app.use("/api/shifts", shiftRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/order-items", orderItemRoutes);

app.use("/api/order-item-options", orderItemOptionRoutes);

app.use("/api/ingredients", ingredientRoutes);

app.use("/api/recipe-ingredients", recipeIngredientRoutes);

app.use("/api/point-logs", pointLogRoutes);
app.use("/api/settings", settingsRoutes);

// �ѧ��ѹ������ѹ���������
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("? PostgreSQL Database connected successfully.");

    await migrateInventoryTimestamps();
    await sequelize.sync({ alter: true });
    console.log("? Database synchronized successfully.");
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("? �������ö�������͡Ѻ�ҹ��������:", error);
  }
};

startServer();
