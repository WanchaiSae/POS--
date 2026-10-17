import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Product from "./Product";
import Ingredient from "./Ingredient";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ recipe_ingredients[cite: 12]
interface RecipeIngredientAttributes {
  id: number;
  product_id: number;
  ingredient_id: number;
  stock_quantity: number;
  quantity_required: number;
  last_updated_at?: Date;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id ��� stock_quantity �դ��������� ����ö�������)[cite: 12]
interface RecipeIngredientCreationAttributes extends Optional<
  RecipeIngredientAttributes,
  "id" | "stock_quantity" | "last_updated_at"
> {}

// 3. ���ҧ Class RecipeIngredient �׺�ʹ�ҡ Sequelize Model
class RecipeIngredient
  extends Model<RecipeIngredientAttributes, RecipeIngredientCreationAttributes>
  implements RecipeIngredientAttributes
{
  public id!: number;
  public product_id!: number;
  public ingredient_id!: number;
  public stock_quantity!: number;
  public quantity_required!: number;
  public last_updated_at?: Date;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
RecipeIngredient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    ingredient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "ingredients", key: "id" },
    },
    stock_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0, //[cite: 12]
    },
    quantity_required: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, //[cite: 12]
    },
    last_updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "recipe_ingredients",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at ��� ER Diagram[cite: 12]
  },
);

// ��˹���������ѹ�� (Associations)
RecipeIngredient.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});
RecipeIngredient.belongsTo(Ingredient, {
  foreignKey: "ingredient_id",
  as: "ingredient",
});

Product.hasMany(RecipeIngredient, { foreignKey: "product_id", as: "recipes" });
Ingredient.hasMany(RecipeIngredient, {
  foreignKey: "ingredient_id",
  as: "recipe_ingredients",
});

export default RecipeIngredient;
