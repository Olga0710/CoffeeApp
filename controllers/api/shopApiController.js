const db = require('../../models/db');

// Отримати список усіх кав'ярень (GET)
exports.getAllShops = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера при отриманні списку кав'ярень", details: err.message });
    }
};

// Отримати кав'ярню за ID (GET)
exports.getShopById = async (req, res) => {
    const shopId = req.params.id;
    try {
        const result = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = result.rows[0];
        if (!shop) {
            return res.status(404).json({ error: "Кав'ярню не знайдено" });
        }
        res.status(200).json(shop);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера", details: err.message });
    }
};

// Створити нову кав'ярню (POST)
exports.createShop = async (req, res) => {
    const { name, description, address, opening_hours, image_url } = req.body;

    if (!name || !address) {
        return res.status(400).json({ error: "Поля 'name' та 'address' є обов'язковими" });
    }

    try {
        const result = await db.query(
            'INSERT INTO shops (name, description, address, opening_hours, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, address, opening_hours, image_url]
        );
        res.status(201).json({ message: "Кав'ярню успішно створено", shop: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні кав'ярні", details: err.message });
    }
};

// Оновити кав'ярню (PUT)
exports.updateShop = async (req, res) => {
    const shopId = req.params.id;
    const { name, description, address, opening_hours, image_url } = req.body;

    try {
        const result = await db.query(
            'UPDATE shops SET name = $1, description = $2, address = $3, opening_hours = $4, image_url = $5 WHERE id = $6 RETURNING *',
            [name, description, address, opening_hours, image_url, shopId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено для оновлення" });
        }

        res.status(200).json({ message: "Кав'ярню оновлено", shop: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при оновленні", details: err.message });
    }
};

// Видалити кав'ярню (DELETE)
exports.deleteShop = async (req, res) => {
    const shopId = req.params.id;
    try {
        const result = await db.query('DELETE FROM shops WHERE id = $1 RETURNING *', [shopId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено для видалення" });
        }

        res.status(200).json({ message: "Кав'ярню успішно видалено", deletedShop: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні", details: err.message });
    }
};