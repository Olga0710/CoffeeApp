const db = require('../../models/db');

// Отримати меню кав'ярні (GET)
exports.getShopMenu = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }

        const menuResult = await db.query('SELECT * FROM menu_items WHERE shop_id = $1 ORDER BY id DESC', [shopId]);
        res.status(200).json(menuResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера при отриманні меню", details: err.message });
    }
};

// Додати позицію в меню (POST)
exports.addMenuItem = async (req, res) => {
    const shopId = req.params.shopId;
    const { category_id, name, description, price, image_url } = req.body;

    if (!name || price === undefined || !category_id) {
        return res.status(400).json({ error: "Поля 'name', 'price' та 'category_id' є обов'язковими" });
    }

    try {
        const result = await db.query(
            'INSERT INTO menu_items (shop_id, category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [shopId, category_id, name, description, price, image_url]
        );
        res.status(201).json({ message: "Позицію меню успішно додано", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при додаванні позиції", details: err.message });
    }
};

// Оновити позицію меню (PUT)
exports.updateMenuItem = async (req, res) => {
    const itemId = req.params.itemId;
    const { category_id, name, description, price, image_url } = req.body;

    try {
        const result = await db.query(
            'UPDATE menu_items SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5 WHERE id = $6 RETURNING *',
            [category_id, name, description, price, image_url, itemId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Позицію меню не знайдено" });
        }

        res.status(200).json({ message: "Позицію меню оновлено", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні позиції", details: err.message });
    }
};

// Видалити позицію меню (DELETE)
exports.deleteMenuItem = async (req, res) => {
    const itemId = req.params.itemId;
    try {
        const result = await db.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [itemId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Позицію меню не знайдено" });
        }

        res.status(200).json({ message: "Позицію меню успішно видалено", deletedItem: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні позиції", details: err.message });
    }
};