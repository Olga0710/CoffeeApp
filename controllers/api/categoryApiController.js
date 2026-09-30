const db = require('../../models/db');

// 1. GET: Отримати всі категорії певної кав'ярні
exports.getShopCategories = async (req, res) => {
    const { shopId } = req.params;
    try {
        const result = await db.query('SELECT * FROM categories WHERE shop_id = $1 ORDER BY id ASC', [shopId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

// 2. POST: Створити нову категорію для кав'ярні
exports.createCategory = async (req, res) => {
    const { shopId } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Назва категорії є обов'язковою" });
    }

    try {
        const result = await db.query(
            'INSERT INTO categories (shop_id, name) VALUES ($1, $2) RETURNING *',
            [shopId, name]
        );
        res.status(201).json({ message: "Категорію створено", category: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні категорії" });
    }
};

// 3. PUT: Оновити категорію
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Назва категорії є обов'язковою" });
    }

    try {
        const check = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Категорію не знайдено" });
        }

        const result = await db.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        res.status(200).json({ message: "Категорію оновлено", category: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні" });
    }
};

// 4. DELETE: Видалити категорію
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Категорію не знайдено" });
        }

        await db.query('DELETE FROM categories WHERE id = $1', [id]);
        res.status(200).json({ message: "Категорію успішно видалено" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні" });
    }
};