const db = require('../../models/db');

// Отримати категорії конкретної кав'ярні (GET)
exports.getShopCategories = async (req, res) => {
    const shopId = req.params.shopId;
    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }

        const categoriesResult = await db.query('SELECT * FROM categories WHERE shop_id = $1 ORDER BY id ASC', [shopId]);
        res.status(200).json(categoriesResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера при отриманні категорій", details: err.message });
    }
};

// Створити категорію для кав'ярні (POST)
exports.createCategory = async (req, res) => {
    const shopId = req.params.shopId;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Назва категорії є обов'язковою" });
    }

    try {
        const shopResult = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }

        const result = await db.query(
            'INSERT INTO categories (shop_id, name) VALUES ($1, $2) RETURNING *',
            [shopId, name]
        );
        res.status(201).json({ message: "Категорію успішно створено", category: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні категорії", details: err.message });
    }
};

// Оновити категорію (PUT)
exports.updateCategory = async (req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Назва категорії є обов'язковою" });
    }

    try {
        const result = await db.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, categoryId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Категорію не знайдено" });
        }

        res.status(200).json({ message: "Категорію оновлено", category: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні категорії", details: err.message });
    }
};

// Видалити категорію (DELETE)
exports.deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [categoryId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Категорію не знайдено" });
        }

        res.status(200).json({ message: "Категорію успішно видалено", deletedCategory: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні категорії", details: err.message });
    }
};