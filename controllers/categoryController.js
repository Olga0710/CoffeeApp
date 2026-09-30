const db = require('../models/db');


exports.getShopCategories = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }

        const categoriesResult = await db.query('SELECT * FROM categories WHERE shop_id = $1 ORDER BY id ASC', [shopId]);

        res.render('category/list', { shop, categories: categoriesResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера при отриманні категорій: " + err.message);
    }
};

exports.getCreateForm = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }
        res.render('category/create', { shop });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};

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


exports.getEditCategoryForm = async (req, res) => {
    const { shopId, id } = req.params;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) return res.status(404).send("Кав'ярню не знайдено");

        const categoryResult = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        const category = categoryResult.rows[0];
        if (!category) return res.status(404).send("Категорію не знайдено");

        res.render('category/edit', { shop, category });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера: " + err.message);
    }
};


exports.updateCategory = async (req, res) => {
    const { shopId, id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).send("Назва категорії є обов'язковою");
    }

    try {
        await db.query('UPDATE categories SET name = $1 WHERE id = $2', [name, id]);
        res.redirect(`/shops/${shopId}/categories`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при оновленні категорії: " + err.message);
    }
};


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