const { Pool } = require('pg');
const isDockerLocal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@db:');

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
};

if (!isDockerLocal) {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = new Pool(poolConfig);

console.log(Підключення до PostgreSQL ініціалізовано(${ isDockerLocal? 'Local / Docker': 'Production / Render' }).);

const initDb = async () => {
    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                address TEXT NOT NULL,
                opening_hours TEXT,
                image_url TEXT
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
                category_id INTEGER  NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                price REAL NOT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        `);



        console.log('Таблиці успішно створені або вже існують у PostgreSQL.');
    } catch (err) {
        console.error('Помилка створення таблиць у БД:', err);
    }
};

initDb();

module.exports = pool;