const db = require('../../models/db');

// 1. GET: Отримати все меню конкретної кав'ярні у форматі JSON
exports.getShopMenu = async (req, res) => {
    const { shopId } = req.params;
    try {
        const menuResult = await db.query('SELECT * FROM menu_items WHERE shop_id = $1 ORDER BY id DESC', [shopId]);
        res.status(200).json(menuResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка завантаження меню" });
    }
};

// 2. POST: Додати нову позицію в меню (з тілом JSON)
exports.addMenuItem = async (req, res) => {
    const { shopId } = req.params;
    const { category_id, name, description, price, image_url } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: "Назва та ціна є обов'язковими" });
    }

    const query = `
        INSERT INTO menu_items (shop_id, category_id, name, description, price, image_url) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;

    try {
        const result = await db.query(query, [shopId, category_id, name, description, price, image_url]);
        res.status(201).json({ message: "Позицію успішно додано", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при додаванні позиції" });
    }
};

// 3. PUT: Оновити позицію в меню
exports.updateMenuItem = async (req, res) => {
    const { itemId } = req.params;
    const { category_id, name, description, price, image_url } = req.body;

    const query = `
        UPDATE menu_items 
        SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5
        WHERE id = $6 RETURNING *
    `;

    try {
        const check = await db.query('SELECT * FROM menu_items WHERE id = $1', [itemId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Позицію меню не знайдено" });
        }

        const result = await db.query(query, [category_id, name, description, price, image_url, itemId]);
        res.status(200).json({ message: "Позицію оновлено", item: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні" });
    }
};

// 4. DELETE: Видалити позицію з меню
exports.deleteMenuItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        const check = await db.query('SELECT * FROM menu_items WHERE id = $1', [itemId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Позицію меню не знайдено" });
        }

        await db.query('DELETE FROM menu_items WHERE id = $1', [itemId]);
        res.status(200).json({ message: "Позицію успішно видалено" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні" });
    }
};