import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Customer from "./Customer";
import Order from "./Order";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ point_logs
interface PointLogAttributes {
  id: number;
  customer_id?: number | null;
  order_id?: number | null;
  points_changed: number;
  type: string;
  created_at?: string;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, customer_id, order_id, created_at ����ö�������)
interface PointLogCreationAttributes
  extends Optional<
    PointLogAttributes,
    "id" | "customer_id" | "order_id" | "created_at"
  > {}

// 3. ���ҧ Class PointLog �׺�ʹ�ҡ Sequelize Model
class PointLog
  extends Model<PointLogAttributes, PointLogCreationAttributes>
  implements PointLogAttributes
{
  public id!: number;
  public customer_id?: number | null;
  public order_id?: number | null;
  public points_changed!: number;
  public type!: string;

  public readonly created_at!: string;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
PointLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "customers", key: "id" },
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "orders", key: "id" },
    },
    points_changed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "point_logs",
    timestamps: true,
    updatedAt: false, // ����տ�Ŵ� updated_at ��� ER Diagram
    createdAt: "created_at",
  },
);

// ��˹���������ѹ�� (Associations)
PointLog.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
PointLog.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Customer.hasMany(PointLog, { foreignKey: "customer_id", as: "point_logs" });
Order.hasMany(PointLog, { foreignKey: "order_id", as: "point_logs" });

export default PointLog;
