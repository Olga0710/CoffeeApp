const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5433/coffeedb';
const isDockerLocal = !process.env.DATABASE_URL || (
    process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1') ||
    process.env.DATABASE_URL.includes('@db')
);
const poolConfig = {
    connectionString: connectionString,
};

if (!isDockerLocal) {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = new Pool(poolConfig);
console.log(`Підключення до PostgreSQL ініціалізовано (${isDockerLocal ? 'Local / Docker' : 'Production / Render'}).`);

const initDb = async () => {
    try {
        // 1. Спочатку створюємо базові таблиці, якщо їх ще немає
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                address TEXT NOT NULL,
                opening_hours TEXT,
                image_url TEXT,
                latitude NUMERIC(9, 6) DEFAULT 50.4501,
                longitude NUMERIC(9, 6) DEFAULT 30.5234
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER NOT NULL,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                price REAL NOT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        `);

        // 2. Потім виконуємо ALTER TABLE для вже існуючих таблиць (міграції колонок)
        await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS opening_hours TEXT;`);
        await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS image_url TEXT;`);
        await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6) DEFAULT 50.4501;`);
        await pool.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6) DEFAULT 30.5234;`);
        await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id INTEGER;`);

        console.log('Таблиці успішно створені або вже існують у PostgreSQL.');
    } catch (err) {
        console.error('ПОМИЛКА створення таблиць у БД:', err);
    }
};

initDb();

module.exports = pool;