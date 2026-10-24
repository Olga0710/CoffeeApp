const db = require('../models/db');


exports.getAllShops = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops ORDER BY id ASC');
        res.render('shops/list', { shops: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера при отриманні списку: " + err.message);
    }
};

exports.getCreateShopForm = async (req, res) => {
    try {
        res.render('shops/create');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};


exports.createShop = async (req, res) => {
    const { name, description, address, opening_hours, image_url, latitude, longitude } = req.body;
    try {
        let finalLat = latitude;
        let finalLon = longitude;

        if ((!finalLat || !finalLon) && address) {
            try {
                const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Kyiv, Ukraine')}`;
                const response = await fetch(queryUrl, {
                    headers: { 'User-Agent': 'ZruchnoCoffeeApp' } // 
                });
                const geoData = await response.json();

                if (geoData && geoData.length > 0) {
                    finalLat = parseFloat(geoData[0].lat);
                    finalLon = parseFloat(geoData[0].lon);
                }
            } catch (geoErr) {
                console.error("Помилка автогеокодування:", geoErr);
            }
        }

        // Якщо і адресу не знайшлося / не ввели, ставимо центр Києва за замовчуванням
        finalLat = finalLat ? parseFloat(finalLat) : 50.4501;
        finalLon = finalLon ? parseFloat(finalLon) : 30.5234;

        await db.query(

            'INSERT INTO shops (name, description, address, opening_hours, image_url, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
                name,
                description,
                address,
                opening_hours,
                image_url,
                finalLat,   
                finalLon
            ]
        );
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при створенні кав'ярні: " + err.message);
    }
};

exports.getEditShopForm = async (req, res) => {
    const shopId = req.params.id;
    try {
        const result = await db.query('SELECT * FROM shops WHERE id = $1', [shopId]);
        const shop = result.rows[0];
        if (!shop) return res.status(404).send("Кав'ярню не знайдено");
        res.render('shops/edit', { shop });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
};

exports.updateShop = async (req, res) => {
    const shopId = req.params.id;
    const { name, description, address, opening_hours, image_url, latitude, longitude } = req.body;
    try {
        let finalLat = latitude;
        let finalLon = longitude;

        if ((!finalLat || !finalLon) && address) {
            try {
                const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Kyiv, Ukraine')}`;
                const response = await fetch(queryUrl, {
                    headers: { 'User-Agent': 'ZruchnoCoffeeApp' }
                });
                const geoData = await response.json();

                if (geoData && geoData.length > 0) {
                    finalLat = parseFloat(geoData[0].lat);
                    finalLon = parseFloat(geoData[0].lon);
                }
            } catch (geoErr) {
                console.error("Помилка автогеокодування при оновленні:", geoErr);
            }
        }

        // Якщо координати таки не вдалося знайти, спробуємо взяти старі з бази або залишити дефолтні
        if (!finalLat || !finalLon) {
            const oldShop = await db.query('SELECT latitude, longitude FROM shops WHERE id = $1', [shopId]);
            finalLat = oldShop.rows[0]?.latitude || 50.4501;
            finalLon = oldShop.rows[0]?.longitude || 30.5234;        }

        await db.query(
            'UPDATE shops SET name = $1, description = $2, address = $3, opening_hours = $4, image_url = $5, latitude = $6, longitude = $7 WHERE id = $8',
            [
                name,
                description,
                address,
                opening_hours,
                image_url,
                finalLat,
                finalLon,
                shopId
            ]
        );
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при оновленні: " + err.message);
    }
};

exports.deleteShop = async (req, res) => {
    const shopId = req.params.id;
    try {
        await db.query('DELETE FROM shops WHERE id = $1', [shopId]);
        res.redirect('/shops');
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка при видаленні: " + err.message);
    }
};
exports.getShopsApi = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, address, description, image_url, latitude, longitude FROM shops ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при отриманні даних для мапи" });
    }
};


