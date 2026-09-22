const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('Підключення до хмарної бази даних PostgreSQL ініціалізовано.');

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                address TEXT NOT NULL,
                offerings TEXT,
                image_url TEXT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                ingredients TEXT,
                price REAL NOT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER,
                author TEXT,
                comment TEXT NOT NULL,
                rating INTEGER,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
            )
        `);

        console.log('Таблиці успішно створені або вже існують у PostgreSQL.');
    } catch (err) {
        console.error('Помилка створення таблиць у БД:', err.message);
    }
};

initDb();

module.exports = pool;