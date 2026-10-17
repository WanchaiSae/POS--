import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ ingredients[cite: 11]
interface IngredientAttributes {
  id: number;
  name: string;
  unit: string;
  stock_quantity: number;
  min_threshold: number;
  last_updated_at?: Date;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, stock_quantity ��� min_threshold �դ��������� ����ö�������)[cite: 11]
interface IngredientCreationAttributes extends Optional<
  IngredientAttributes,
  "id" | "stock_quantity" | "min_threshold" | "last_updated_at"
> {}

// 3. ���ҧ Class Ingredient �׺�ʹ�ҡ Sequelize Model
class Ingredient
  extends Model<IngredientAttributes, IngredientCreationAttributes>
  implements IngredientAttributes
{
  public id!: number;
  public name!: string;
  public unit!: string;
  public stock_quantity!: number;
  public min_threshold!: number;
  public last_updated_at?: Date;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Ingredient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false, // �����ѵ�شԺ[cite: 11]
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false, // ˹��¹Ѻ �� ����, ������Ե�, ���[cite: 11]
    },
    stock_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0, // ����ҳ�������������� 0.00[cite: 11]
    },
    min_threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100.0, // �����͹�����ʵ�͡��ӡ��ҡ�˹�������� 100.00[cite: 11]
    },
    last_updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "ingredients",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at ��� ER Diagram[cite: 11]
  },
);

export default Ingredient;
