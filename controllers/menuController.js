const db = require('../models/db');

exports.getShopMenu = (req, res) => {
    const shopId = req.params.id;

    db.query('SELECT * FROM shops WHERE id = $1', [shopId], (err, shopResult) => {
        const shop = shopResult ? shopResult.rows[0] : null;
        if (err || !shop) {
            return res.status(404).send("Кав'ярню не знайдено");
        }

        db.query('SELECT * FROM menu_items WHERE shop_id = $1 ORDER BY id DESC', [shopId], (err, menuResult) => {
            if (err) {
                return res.status(500).send("Помилка при завантаженні меню");
            }
            res.render('shops/menu', { shop, menuItems: menuResult.rows });
        });
    });
};

exports.addMenuItem = (req, res) => {
    const shopId = req.params.id;
    const { name, description, ingredients, price, image_url } = req.body;

    const query = `
        INSERT INTO menu_items (shop_id, name, description, ingredients, price, image_url) 
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

    db.query(query, [shopId, name, description, ingredients, price, image_url], (err) => {
        if (err) {
            return res.status(500).send("Помилка при додаванні позиції: " + err.message);
        }
        res.redirect(`/shops/${shopId}/menu`);
    });
};

exports.getEditMenuItemForm = (req, res) => {
    const { shopId, itemId } = req.params;

    db.query('SELECT * FROM shops WHERE id = $1', [shopId], (err, shopResult) => {
        const shop = shopResult ? shopResult.rows[0] : null;
        if (err || !shop) return res.status(404).send("Кав'ярню не знайдено");

        db.query('SELECT * FROM menu_items WHERE id = $1', [itemId], (err, itemResult) => {
            const item = itemResult ? itemResult.rows[0] : null;
            if (err || !item) return res.status(404).send("Позицію меню не знайдено");

            res.render('shops/edit-menu-item', { shop, item });
        });
    });
};

exports.updateMenuItem = (req, res) => {
    const { shopId, itemId } = req.params;
    const { name, description, ingredients, price, image_url } = req.body;

    const query = `
        UPDATE menu_items 
        SET name = $1, description = $2, ingredients = $3, price = $4, image_url = $5
        WHERE id = $6
    `;

    db.query(query, [name, description, ingredients, price, image_url, itemId], (err) => {
        if (err) {
            return res.status(500).send("Помилка при оновленні: " + err.message);
        }
        res.redirect(`/shops/${shopId}/menu`);
    });
};

exports.deleteMenuItem = (req, res) => {
    const { shopId, itemId } = req.params;

    db.query('DELETE FROM menu_items WHERE id = $1', [itemId], (err) => {
        if (err) {
            return res.status(500).send("Помилка при видаленні: " + err.message);
        }
        res.redirect(`/shops/${shopId}/menu`);
    });
};