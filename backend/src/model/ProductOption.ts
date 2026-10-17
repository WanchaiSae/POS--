import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ product_options[cite: 7]
interface ProductOptionAttributes {
  id: number;
  group_name: string;
  name: string;
  extra_price: number;
  is_active: boolean;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, extra_price, is_active �դ��������������������)[cite: 7]
interface ProductOptionCreationAttributes extends Optional<
  ProductOptionAttributes,
  "id" | "extra_price" | "is_active"
> {}

// 3. ���ҧ Class ProductOption �׺�ʹ�ҡ Sequelize Model
class ProductOption
  extends Model<ProductOptionAttributes, ProductOptionCreationAttributes>
  implements ProductOptionAttributes
{
  public id!: number;
  public group_name!: string;
  public name!: string;
  public extra_price!: number;
  public is_active!: boolean;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
ProductOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    group_name: {
      type: DataTypes.STRING(50),
      allowNull: false, // �� 'Sweetness', 'Size', 'Topping'[cite: 7]
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false, // �� '��ҹ 0%', '��ҹ 50%', '���ء'[cite: 7]
    },
    extra_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0, // �ҤҺǡ������������� 0.00[cite: 7]
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // �Դ��ҹ��������� true[cite: 7]
    },
  },
  {
    sequelize,
    tableName: "product_options",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at ��� ER Diagram[cite: 7]
  },
);

export default ProductOption;
