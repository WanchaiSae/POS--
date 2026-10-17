import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ customers[cite: 6]
interface CustomerAttributes {
  id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  points: number;
  tier: string;
  created_at?: string; // �� string �����ͧ�Ѻ����ŧ�������������
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, points, tier, created_at �դ������������ͨѴ����ѵ��ѵ�)[cite: 6]
interface CustomerCreationAttributes extends Optional<
  CustomerAttributes,
  "id" | "first_name" | "last_name" | "points" | "tier" | "created_at"
> {}

// 3. ���ҧ Class Customer �׺�ʹ�ҡ Sequelize Model
class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  public id!: number;
  public phone_number!: string;
  public first_name?: string;
  public last_name?: string;
  public points!: number;
  public tier!: string;

  public readonly created_at!: string;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true, // �������Ѿ��������ӡѹ[cite: 6]
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // ������������ 0[cite: 6]
    },
    tier: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Bronze", // �дѺ��Ҫԡ������� Bronze[cite: 6]
    },
    created_at: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    updatedAt: false, // ����տ�Ŵ� updated_at ��� ER Diagram[cite: 6]
    createdAt: "created_at",
  },
);

export default Customer;
