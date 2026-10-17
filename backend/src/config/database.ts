import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectOptions: process.env.DB_SSL === "false" ? {} : { ssl: { require: true, rejectUnauthorized: false } },
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  })
  : new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false, // �Դ����ʴ� SQL Query ���� � Terminal (�Դ�����ҵ�ͧ��� debug)
    pool: {
      max: 10, // �ӹǹ������������٧�ش������ѹ
      min: 0, // �ӹǹ����������͵���ش� Pool
      acquire: 30000, // �������٧�ش (ms) ��͹�п�ͧ error ��ҵԴ��� DB �����
      idle: 10000, // �����٧�ش (ms) ������� Connection ��������ҧ� ��͹�еѴ�����������
    },
    },
  );

export default sequelize;
