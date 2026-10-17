import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

// 1. ��˹� Interface �ͧ Attributes ������㹵��ҧ shifts
interface ShiftAttributes {
  id: number;
  user_id: number;
  start_amount: number;
  end_amount?: number;
  actual_amount?: number;
  opened_at?: string; // �� string �����ͧ�Ѻ����ŧ�������������
  closed_at?: string;
}

// 2. ��˹� Interface ����Ѻ�͹���ҧ���������� (id, end_amount, actual_amount, opened_at, closed_at �������)[cite: 8]
interface ShiftCreationAttributes extends Optional<
  ShiftAttributes,
  "id" | "end_amount" | "actual_amount" | "opened_at" | "closed_at"
> {}

// 3. ���ҧ Class Shift �׺�ʹ�ҡ Sequelize Model
class Shift
  extends Model<ShiftAttributes, ShiftCreationAttributes>
  implements ShiftAttributes
{
  public id!: number;
  public user_id!: number;
  public start_amount!: number;
  public end_amount?: number;
  public actual_amount?: number;
  public readonly opened_at?: string;
  public closed_at?: string;
}

// 4. ��˹� Schema ��� Options �ͧ���ҧ
Shift.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    start_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false, // �Թ�͹��������Դ��[cite: 8]
    },
    end_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // �ʹ�Թ��ػ�͹�Դ��[cite: 8]
    },
    actual_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // �ʹ�Թ��ԧ�Ѻ�����鹪ѡ[cite: 8]
    },
    opened_at: {
      type: DataTypes.DATE,
      field: "opened_at",
    },
    closed_at: {
      type: DataTypes.DATE,
      field: "closed_at",
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "shifts",
    timestamps: true,
    createdAt: "opened_at", // Map created_at �ͧ Sequelize ���ç�Ѻ opened_at[cite: 8]
    updatedAt: false, // ����տ�Ŵ� updated_at ��� ER Diagram[cite: 8]
  },
);

// ��˹���������ѹ��: Shift �繢ͧ User 1 �� (��� 1 User �������� Shift)
Shift.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Shift, { foreignKey: "user_id", as: "shifts" });

export default Shift;
