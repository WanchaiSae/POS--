import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ categories
interface CategoryAttributes {
  id: number;
  name: string;
  is_active: boolean;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id �� Auto Increment ��� is_active �� Default �� true �֧�������ҧ��)
interface CategoryCreationAttributes extends Optional<
  CategoryAttributes,
  "id" | "is_active"
> {}

// 3. ���ҧ Class Category �׺�ʹ�ҡ Sequelize Model
class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public name!: string;
  public is_active!: boolean;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: false, // ���ͧ�ҡ���ҧ categories � ER Diagram ����տ�Ŵ� created_at / updated_at �֧�Դ�����ҹ timestamps ��Ѻ
  },
);

export default Category;
