import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class AppSetting extends Model {
  public key!: string;
  public value!: string;
}

AppSetting.init(
  {
    key: { type: DataTypes.STRING(100), primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "app_settings", timestamps: false },
);

export default AppSetting;
