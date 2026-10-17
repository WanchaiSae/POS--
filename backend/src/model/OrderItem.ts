import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Order from "./Order";
import Product from "./Product";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ order_items
interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id �� Auto Increment)
interface OrderItemCreationAttributes extends Optional<
  OrderItemAttributes,
  "id"
> {}

// 3. ���ҧ Class OrderItem �׺�ʹ�ҡ Sequelize Model
class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public subtotal!: number;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onDelete: "CASCADE", // ź��¡�÷���ѵ��ѵ��ҡ����������ѡ�١ź
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false, // �ӹǹ�Թ���
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // �Ҥҵ��˹��� � ��Ы���
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // �Ҥ���� (quantity * unit_price)
    },
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at ��� ER Diagram
  },
);

// ��˹���������ѹ�� (Associations)
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Order.hasMany(OrderItem, {
  foreignKey: "order_id",
  as: "items",
  onDelete: "CASCADE",
});
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });

export default OrderItem;
