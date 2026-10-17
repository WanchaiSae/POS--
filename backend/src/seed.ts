import User from "./model/User";
import Category from "./model/Categorie";
import Product from "./model/Product";
import ProductOption from "./model/ProductOption";
import Customer from "./model/Customer";
import Ingredient from "./model/Ingredient";

const seedDatabase = async () => {
  const userRows = [
    { name: "คุณนาม", role: "admin", pin_code: "9999" },
    { name: "พี่แนน", role: "manager", pin_code: "2222" },
    { name: "แคชเชียร์ 01", role: "staff", pin_code: "1234" },
  ];
  for (const row of userRows) {
    const [user] = await User.findOrCreate({ where: { pin_code: row.pin_code }, defaults: row });
    if (/�|๏ฟฝ|เน€เธ|เธ/.test(user.name)) await user.update({ name: row.name, role: row.role });
  }

  const categoryNames = ["เครื่องดื่ม", "อาหาร", "เบเกอรี่", "ของหวาน", "อื่นๆ"];
  const categories = await Promise.all(categoryNames.map(async (name) => {
    const [category] = await Category.findOrCreate({ where: { name }, defaults: { name, is_active: true } });
    if (!category.is_active) await category.update({ is_active: true });
    return category;
  }));
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const productRows = [
    ["อเมริกาโน่", "เครื่องดื่ม", 75, "1514432324607-a09d9b4aefdd"], ["ลาเต้", "เครื่องดื่ม", 85, "1570968915860-54d5c301fa9f"],
    ["คาปูชิโน่", "เครื่องดื่ม", 85, "1534778101976-62847782c213"], ["ชาเขียวมัทฉะ", "เครื่องดื่ม", 95, "1536256263959-770b48d82b0a"],
    ["ชาไทย", "เครื่องดื่ม", 85, "1558857563-b37cf5a8a1b5"], ["ครัวซองต์", "เบเกอรี่", 75, "1555507036-ab1f4038808a"],
    ["ชีสเค้ก", "ของหวาน", 95, "1524351199678-941a58a3df50"], ["บราวนี่", "ของหวาน", 75, "1606313564200-e75d5e30476c"],
    ["ข้าวผัดต้มยำกุ้ง", "อาหาร", 120, "1603133872878-684f208fb84b"], ["สปาเก็ตตี้คาโบนาร่า", "อาหาร", 145, "1551183053-bf91a1d81141"],
    ["ขนมปังกระเทียมชีส", "เบเกอรี่", 85, "1573140247632-f8fd74997d5c"], ["แพนเค้กสตรอว์เบอร์รี่", "ของหวาน", 115, "1567620905732-2d1ec7ab7445"],
    ["มอคค่าเย็น", "เครื่องดื่ม", 90, "1517701550927-30cf4ba1dba5"], ["ฮันนี่โทสต์ผลไม้รวม", "ของหวาน", 165, "1484723091739-30a097e8f929"],
    ["น้ำแร่ออร์แกนิก", "อื่นๆ", 25, "1523362628745-0c100150b504"], ["เมล็ดกาแฟ House Blend 250g", "อื่นๆ", 280, "1559056199-641a0ac8b55e"],
  ] as const;

  for (const [name, categoryName, price, imageId] of productRows) {
    const defaults = { name, category_id: categoryByName[categoryName].id, base_price: price, image_url: `https://images.unsplash.com/photo-${imageId}?w=500&auto=format&fit=crop&q=80`, is_active: true };
    const [product] = await Product.findOrCreate({ where: { name }, defaults });
    if (/�|๏ฟฝ|เน€เธ|เธ/.test(product.name)) await product.update(defaults);
  }

  const options = [
    ["Sweetness", "หวาน 0%", 0], ["Sweetness", "หวาน 50%", 0], ["Sweetness", "หวาน 100%", 0],
    ["Size", "Size S", 0], ["Size", "Size M", 10], ["Size", "Size L", 20],
    ["Topping", "ไข่มุก", 15], ["Topping", "วิปครีม", 15], ["Topping", "เจลลี่", 10],
  ] as const;
  for (const [group_name, name, extra_price] of options) {
    await ProductOption.findOrCreate({ where: { group_name, name }, defaults: { group_name, name, extra_price, is_active: true } });
  }

  const customers = [
    { phone_number: "0812345678", first_name: "สมชาย", last_name: "ใจดี", points: 120, tier: "Silver" },
    { phone_number: "0898765432", first_name: "มาลี", last_name: "รักกาแฟ", points: 540, tier: "Gold" },
    { phone_number: "0621112233", first_name: "วิชัย", last_name: "สายหวาน", points: 35, tier: "Bronze" },
  ];
  for (const customer of customers) {
    const [record] = await Customer.findOrCreate({ where: { phone_number: customer.phone_number }, defaults: customer });
    if (/�|๏ฟฝ|เน€เธ|เธ/.test(`${record.first_name} ${record.last_name}`)) await record.update(customer);
  }

  const ingredients = [
    ["นมสด", "ml", 8000, 1000], ["เมล็ดกาแฟ", "g", 2500, 300], ["น้ำตาล", "g", 4000, 400], ["ผงชาเขียว", "g", 900, 150],
    ["ชาไทย", "g", 900, 150], ["แป้งสาลี", "g", 3000, 400], ["เนย", "g", 1800, 250], ["ไข่มุก", "g", 1200, 200], ["ผงโกโก้", "g", 700, 120],
  ] as const;
  for (const [name, unit, stock_quantity, min_threshold] of ingredients) {
    const [record] = await Ingredient.findOrCreate({ where: { name }, defaults: { name, unit, stock_quantity, min_threshold } });
    if (/�|๏ฟฝ|เน€เธ|เธ/.test(record.name)) await record.update({ name, unit, stock_quantity, min_threshold });
  }
  console.log("Seed completed: users, products, categories, customers, options, and inventory.");
};

export default seedDatabase;
