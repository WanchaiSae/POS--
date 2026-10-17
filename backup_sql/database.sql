-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories & Products
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 4. Shifts & Orders
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    shift_id INT REFERENCES shifts(id),
    user_id INT REFERENCES users(id),
    customer_id INT REFERENCES customers(id),
    total_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    net_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'COMPLETED',
    points_earned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items & Options
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_item_options (
    id BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT REFERENCES order_items(id) ON DELETE CASCADE,
    option_id INT,
    extra_price NUMERIC(10,2) DEFAULT 0.00
);

-- 6. Stock & Recipes
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    stock_quantity NUMERIC(10,2) DEFAULT 0.00,
    min_threshold NUMERIC(10,2) DEFAULT 100.00
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    ingredient_id INT REFERENCES ingredients(id),
    stock_quantity NUMERIC(10,2) DEFAULT 0.00,
    quantity_required NUMERIC(10,2) NOT NULL
);

-- 7. Point Logs
CREATE TABLE IF NOT EXISTS point_logs (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    order_id BIGINT REFERENCES orders(id),
    points_changed INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);