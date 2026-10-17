import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ users
interface UserAttributes {
  id: number;
  name: string;
  role: string;
  is_active: boolean;
  deactivated_at?: Date | null;
  pin_code?: string; // ��� ? ���� nullable (�����ѧ�Ѻ���ء��)
  created_at?: string;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (�ѹ�˹�� Auto Increment ���� Default ����������)
interface UserCreationAttributes extends Optional<
  UserAttributes,
  "id" | "role" | "is_active" | "deactivated_at" | "pin_code" | "created_at"
> {}

// 3. ���ҧ Class User �׺�ʹ�ҡ Sequelize Model
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public role!: string;
  public is_active!: boolean;
  public deactivated_at?: Date | null;
  public pin_code?: string;

  public readonly created_at!: string;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "staff",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    deactivated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    pin_code: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true, // �Դ��ҹ timestamps �������Ѵ��� created_at / updated_at �ѵ��ѵ�
    updatedAt: false, // � ER Diagram ���� created_at �֧�Դ updated_at ���
    createdAt: "created_at", // Map ���� column � DB ���ç�Ѻ created_at
  },
);

export default User;
