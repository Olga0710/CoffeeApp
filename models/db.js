const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.resolve(__dirname, '../database.sqlite');
console.log('📌 ФАЙЛ БАЗИ ДАНИХ ЗХОДИТЬСЯ ЗА АДРЕСОЮ:', dbFile);

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Помилка відкриття БД:', err.message);
    } else {
        console.log('Успішно підключено до бази даних SQLite.');
    }
});

db.serialize(() => {
    
    db.run(`CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        offerings TEXT,
        image_url TEXT
    )`);

    
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        ingredients TEXT,
        price REAL NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
    )`, (err) => {
       
        if (!err) {
            db.run(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`, () => {
                
            });
        }
    });

    
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER,
        author TEXT,
        comment TEXT NOT NULL,
        rating INTEGER,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
    )`);
});

module.exports = db;