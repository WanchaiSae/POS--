import dotenv from "dotenv";
import sequelize from "./config/database";
import "./model/User";
import "./model/Categorie";
import "./model/Product";
import "./model/ProductOption";
import "./model/Customer";
import "./model/Ingredient";
import "./model/RecipeIngredient";
import seedDatabase from "./seed";

dotenv.config();

const runSeed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedDatabase();
    console.log("Demo data is ready.");
  } catch (error) {
    console.error("Could not seed the database:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

void runSeed();
