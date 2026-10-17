import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Category from "./Categorie";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ products[cite: 5]
interface ProductAttributes {
  id: number;
  category_id: number;
  name: string;
  base_price: number;
  image_url?: string; // ��� ? �����繤�ҷ����ҧ�� (Nullable)[cite: 5]
  is_active: boolean;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id �� Auto Increment, image_url ��� is_active �դ���������/�������)[cite: 5]
interface ProductCreationAttributes extends Optional<
  ProductAttributes,
  "id" | "image_url" | "is_active"
> {}

// 3. ���ҧ Class Product �׺�ʹ�ҡ Sequelize Model
class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public category_id!: number;
  public name!: string;
  public base_price!: number;
  public image_url?: string;
  public is_active!: boolean;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // ������͹� DEFAULT true �������[cite: 5]
    },
  },
  {
    sequelize,
    tableName: "products",
    timestamps: false, // ����տ�Ŵ� created_at / updated_at 㹵��ҧ products ��� ER Diagram[cite: 5]
  },
);

// 5. ��˹���������ѹ�� (Associations)
// �Թ��� 1 ��Դ �ѧ�Ѵ��������Ǵ�������� (Category)
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });
// 1 ��Ǵ���� ���Թ�����������¡�� (Categories -> Products)[cite: 1]
Category.hasMany(Product, { foreignKey: "category_id", as: "products" });

export default Product;
