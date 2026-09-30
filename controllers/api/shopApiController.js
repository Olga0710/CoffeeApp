const db = require('../../models/db');


exports.getAllShops = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера при отриманні кав'ярень" });
    }
};

exports.getShopById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM shops WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

exports.createShop = async (req, res) => {
    const { name, address } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Назва кав'ярні є обов'язковою" });
    }

    try {
        const result = await db.query(
            'INSERT INTO shops (name, address) VALUES ($1, $2) RETURNING *',
            [name, address || '']
        );
        res.status(201).json({
            message: "Кав'ярню успішно створено",
            shop: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні кав'ярні" });
    }
};

exports.updateShop = async (req, res) => {
    const { id } = req.params;
    const { name, address } = req.body;

    try {
        const check = await db.query('SELECT * FROM shops WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }

        const result = await db.query(
            'UPDATE shops SET name = COALESCE($1, name), address = COALESCE($2, address) WHERE id = $3 RETURNING *',
            [name, address, id]
        );

        res.status(200).json({
            message: "Кав'ярню оновлено",
            shop: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні кав'ярні" });
    }
};

exports.deleteShop = async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.query('SELECT * FROM shops WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }

        await db.query('DELETE FROM shops WHERE id = $1', [id]);
        res.status(200).json({ message: "Кав'ярню успішно видалено" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні кав'ярні" });
    }
};