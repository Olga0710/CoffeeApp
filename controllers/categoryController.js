const db = require('../models/db');

// Отримати список категорій для конкретної кав'ярні (Read)
exports.getShopCategories = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }

        const categoriesResult = await db.query('SELECT * FROM categories WHERE shop_id = $1 ORDER BY id ASC', [shopId]);

        res.render('categories/list', { shop, categories: categoriesResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера при отриманні категорій: " + err.message);
    }
};

// Форма створення нової категорії для кав'ярні
exports.getCreateForm = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }
        res.render('categories/create', { shop });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};

// Створити нову категорію для кав'ярні (Create)
exports.createCategory = async (req, res) => {
    const shopId = req.params.shopId;
    const { name } = req.body;

    if (!name) {
        return res.status(400).send("Назва категорії є обов'язковою");
    }

    try {
        await db.query('INSERT INTO categories (shop_id, name) VALUES ($1, $2)', [shopId, name]);
        res.redirect(`/shops/${shopId}/categories`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при додаванні категорії: " + err.message);
    }
};

// Видалити категорію (Delete)
exports.deleteCategory = async (req, res) => {
    const { shopId, id } = req.params;
    try {
        await db.query('DELETE FROM categories WHERE id = $1', [id]);
        res.redirect(`/shops/${shopId}/categories`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при видаленні категорії: " + err.message);
    }
};