const db = require('../models/db');


exports.getShopMenu = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }

        const catResult = await db.query('SELECT * FROM categories WHERE shop_id = $1 ORDER BY id ASC', [shopId]);
        const categories = catResult.rows;

        const menuResult = await db.query('SELECT * FROM menu_items WHERE shop_id = $1 ORDER BY id DESC', [shopId]);

        res.render('menu/list', { shop, categories, menuItems: menuResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка завантаження меню: " + err.message);
    }
};

exports.addMenuItem = async (req, res) => {
    const shopId = req.params.shopId;
    const { category_id, name, description, price, image_url } = req.body;

    const query = `
        INSERT INTO menu_items (shop_id, category_id, name, description, price, image_url) 
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

    try {
        await db.query(query, [shopId, category_id, name, description, price, image_url]);
        res.redirect(`/shops/${shopId}/menu`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при додаванні позиції: " + err.message);
    }
};

exports.getEditMenuItemForm = async (req, res) => {
    const { shopId, itemId } = req.params;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = shopResult.rows[0];
        if (!shop) return res.status(404).send("Кав'ярню не знайдено");

        const catResult = await db.query('SELECT * FROM categories WHERE shop_id = $1', [shopId]);
        const categories = catResult.rows;

        const itemResult = await db.query('SELECT * FROM menu_items WHERE id = $1', [itemId]);
        const item = itemResult.rows[0];
        if (!item) return res.status(404).send("Позицію меню не знайдено");

        res.render('menu/edit', { shop, categories, item });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера: " + err.message);
    }
};

exports.updateMenuItem = async (req, res) => {
    const { shopId, itemId } = req.params;
    const { category_id, name, description, price, image_url } = req.body;

    const query = `
        UPDATE menu_items 
        SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5
        WHERE id = $6
    `;

    try {
        await db.query(query, [category_id, name, description, price, image_url, itemId]);
        res.redirect(`/shops/${shopId}/menu`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при оновленні: " + err.message);
    }
};

exports.deleteMenuItem = async (req, res) => {
    const { shopId, itemId } = req.params;
    try {
        await db.query('DELETE FROM menu_items WHERE id = $1', [itemId]);
        res.redirect(`/shops/${shopId}/menu`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при видаленні: " + err.message);
    }
};