import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import OrderItem from "./OrderItem";
import ProductOption from "./ProductOption";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ order_item_options
interface OrderItemOptionAttributes {
  id: number;
  order_item_id: number;
  option_id: number;
  extra_price: number;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id ��� extra_price �դ��������������������)
interface OrderItemOptionCreationAttributes extends Optional<
  OrderItemOptionAttributes,
  "id" | "extra_price"
> {}

// 3. ���ҧ Class OrderItemOption �׺�ʹ�ҡ Sequelize Model
class OrderItemOption
  extends Model<OrderItemOptionAttributes, OrderItemOptionCreationAttributes>
  implements OrderItemOptionAttributes
{
  public id!: number;
  public order_item_id!: number;
  public option_id!: number;
  public extra_price!: number;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
OrderItemOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "order_items", key: "id" },
      onDelete: "CASCADE", // ź������͡����ѵ��ѵ��ҡ��¡���Թ�����ѡ�١ź
    },
    option_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "product_options", key: "id" },
    },
    extra_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0, // �ҤҺǡ����������� 0.00
    },
  },
  {
    sequelize,
    tableName: "order_item_options",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at ��� ER Diagram
  },
);

// ��˹���������ѹ�� (Associations)
OrderItemOption.belongsTo(OrderItem, {
  foreignKey: "order_item_id",
  as: "order_item",
});
OrderItemOption.belongsTo(ProductOption, {
  foreignKey: "option_id",
  as: "product_option",
});

OrderItem.hasMany(OrderItemOption, {
  foreignKey: "order_item_id",
  as: "selected_options",
  onDelete: "CASCADE",
});
ProductOption.hasMany(OrderItemOption, {
  foreignKey: "option_id",
  as: "order_item_options",
});

export default OrderItemOption;
