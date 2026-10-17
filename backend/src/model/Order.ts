import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Shift from "./Shift";
import User from "./User";
import Customer from "./Customer";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ orders[cite: 9]
interface OrderAttributes {
  id: number;
  order_number: string;
  shift_id?: number;
  user_id?: number;
  customer_id?: number;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_method: string;
  payment_status: string;
  points_earned: number;
  created_at?: string; // �ͧ�Ѻ����ŧ�������������
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, discount_amount, payment_status, points_earned, created_at �դ��������������������)[cite: 9]
interface OrderCreationAttributes extends Optional<
  OrderAttributes,
  | "id"
  | "shift_id"
  | "user_id"
  | "customer_id"
  | "discount_amount"
  | "payment_status"
  | "points_earned"
  | "created_at"
> {}

// 3. ���ҧ Class Order �׺�ʹ�ҡ Sequelize Model
class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public order_number!: string;
  public shift_id?: number;
  public user_id?: number;
  public customer_id?: number;
  public total_amount!: number;
  public discount_amount!: number;
  public net_amount!: number;
  public payment_method!: string;
  public payment_status!: string;
  public points_earned!: number;

  public readonly created_at!: string;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true, // �Ţ��������/���������������[cite: 9]
    },
    shift_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "shifts", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "customers", key: "id" },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // �ʹ�����͹��ǹŴ[cite: 9]
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0, // ��ǹŴ������� 0.00[cite: 9]
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // �ʹ�ط����ѧ�ѡ��ǹŴ[cite: 9]
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false, // �� 'CASH', 'QR_CODE', 'CREDIT_CARD'[cite: 9]
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "COMPLETED", // ʶҹС�è����Թ������� COMPLETED[cite: 9]
    },
    points_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // ���������Ѻ�ҡ��Ź��[cite: 9]
    },
    created_at: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    updatedAt: false, // ����տ�Ŵ� updated_at ��� ER Diagram[cite: 9]
    createdAt: "created_at",
  },
);

// ��˹���������ѹ�� (Associations)
Order.belongsTo(Shift, { foreignKey: "shift_id", as: "shift" });
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });
Order.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Shift.hasMany(Order, { foreignKey: "shift_id", as: "orders" });
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Customer.hasMany(Order, { foreignKey: "customer_id", as: "orders" });

export default Order;
