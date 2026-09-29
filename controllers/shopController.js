const db = require('../models/db');

// Отримати список усіх кав'ярень (Read)
exports.getAllShops = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops ORDER BY id ASC');
        res.render('shops/list', { shops: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера при отриманні списку: " + err.message);
    }
};

// Форма створення кав'ярні
exports.getCreateShopForm = async (req, res) => {
    try {
        res.render('shops/create');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};

// Створити кав'ярню (Create)
exports.createShop = async (req, res) => {
    const { name, description, address, opening_hours, image_url } = req.body;
    try {
        await db.query(
            'INSERT INTO shops (name, description, address, opening_hours, image_url) VALUES ($1, $2, $3, $4, $5)',
            [name, description, address, opening_hours, image_url]
        );
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при створенні кав'ярні: " + err.message);
    }
};

// Форма редагування кав'ярні
exports.getEditShopForm = async (req, res) => {
    const shopId = req.params.id;
    try {
        const result = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = result.rows[0];
        if (!shop) return res.status(404).send("Кав'ярню не знайдено");
        res.render('shops/edit', { shop });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};

// Оновити кав'ярню (Update)
exports.updateShop = async (req, res) => {
    const shopId = req.params.id;
    const { name, description, address, opening_hours, image_url } = req.body;
    try {
        await db.query(
            'UPDATE shops SET name = $1, description = $2, address = $3, opening_hours = $4, image_url = $5 WHERE id = $6',
            [name, description, address, opening_hours, image_url, shopId]
        );
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при оновленні: " + err.message);
    }
};

// Видалити кав'ярню (Delete)
exports.deleteShop = async (req, res) => {
    const shopId = req.params.id;
    try {
        await db.query('DELETE FROM shops WHERE id = $1', [shopId]);
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при видаленні: " + err.message);
    }
};