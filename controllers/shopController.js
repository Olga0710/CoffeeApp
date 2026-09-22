const db = require('../models/db');

exports.getAllShops = (req, res) => {
    const query = `SELECT * FROM shops ORDER BY id DESC`;

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Помилка сервера при отриманні списку: " + err.message);
        }
        // У PostgreSQL дані лежать у масиві result.rows
        res.render('shops/list', { shops: result.rows });
    });
};

exports.getCreateForm = (req, res) => {
    res.render('shops/create');
};

exports.createShop = (req, res) => {
    const { name, description, address, offerings, image_url } = req.body;
    const query = `
        INSERT INTO shops (name, description, address, offerings, image_url) 
        VALUES ($1, $2, $3, $4, $5)
    `;
    db.query(query, [name, description, address, offerings, image_url], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Помилка при додаванні кав'ярні: " + err.message);
        }
        res.redirect('/shops');
    });
};

exports.deleteShop = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM shops WHERE id = $1', [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Помилка при видаленні: " + err.message);
        }
        res.redirect('/shops');
    });
};

exports.getEditForm = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM shops WHERE id = $1', [id], (err, result) => {
        if (err || !result.rows[0]) {
            console.error(err);
            return res.status(404).send("Кав'ярню не знайдено");
        }
        res.render('shops/edit', { shop: result.rows[0] });
    });
};

exports.updateShop = (req, res) => {
    const { id } = req.params;
    const { name, description, address, offerings, image_url } = req.body;
    const query = `
        UPDATE shops 
        SET name = $1, description = $2, address = $3, offerings = $4, image_url = $5
        WHERE id = $6
    `;
    db.query(query, [name, description, address, offerings, image_url, id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Помилка при оновленні кав'ярні: " + err.message);
        }
        res.redirect('/shops');
    });
};