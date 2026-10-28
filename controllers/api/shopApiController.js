const db = require('../../models/db');
const cache = require('../../services/cache');

// Отримати список усіх кав'ярень (GET)
exports.getAllShops = async (req, res) => {
    try {
        const cacheKey = 'all_shops_api';

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            console.log("⚡ Відповідь взято з Кешу (Memory Cache)");
            return res.status(200).json({
                source: 'cache',
                data: cachedData
            });
        }
        const result = await db.query('SELECT * FROM shops ORDER BY id ASC');
        const shops = result.rows;

        cache.set(cacheKey, shops, 60);

        console.log("🗄️ Відповідь отримана з Бази Даних та збережена в кеш");
        res.status(200).json({
            source: 'database',
            data: shops
        });
        
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
    const { name, description, address, opening_hours, image_url, latitude, longitude } = req.body;

    if (!name || !address) {
        return res.status(400).json({ error: "Поля 'name' та 'address' є обов'язковими" });
    }

    try {
        let finalLat = latitude;
        let finalLon = longitude;

        if ((!finalLat || !finalLon) && address) {
            try {
                const cleanAddress = address.toLowerCase().includes('київ') ? address : `${address}, Київ, Україна`;
                const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1`;

                const response = await fetch(queryUrl, {
                    headers: { 'User-Agent': 'ZruchnoCoffeeApp/1.0' }
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

        finalLat = finalLat ? parseFloat(finalLat) : 50.4501;
        finalLon = finalLon ? parseFloat(finalLon) : 30.5234;

        const result = await db.query(
            'INSERT INTO shops (name, description, address, opening_hours, image_url, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
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
        cache.del('all_shops_api');

        res.status(201).json({ message: "Кав'ярню успішно створено", shop: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні кав'ярні", details: err.message });
    }
};

// Оновити кав'ярню (PUT)
exports.updateShop = async (req, res) => {
    const shopId = req.params.id;
    const { name, description, address, opening_hours, image_url, latitude, longitude } = req.body;

    try {
        let finalLat = latitude;
        let finalLon = longitude;

        if ((!finalLat || !finalLon) && address) {
            try {
                const cleanAddress = address.toLowerCase().includes('київ') ? address : `${address}, Київ, Україна`;
                const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1`;

                const response = await fetch(queryUrl, {
                    headers: { 'User-Agent': 'ZruchnoCoffeeApp/1.0' }
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

        
        if (!finalLat || !finalLon) {
            const oldShopRes = await db.query('SELECT latitude, longitude FROM shops WHERE id = $1', [shopId]);
            if (oldShopRes.rows.length > 0) {
                finalLat = finalLat || oldShopRes.rows[0].latitude;
                finalLon = finalLon || oldShopRes.rows[0].longitude;
            }
        }

        finalLat = finalLat ? parseFloat(finalLat) : 50.4501;
        finalLon = finalLon ? parseFloat(finalLon) : 30.5234;
        const result = await db.query(
            'UPDATE shops SET name = $1, description = $2, address = $3, opening_hours = $4, image_url = $5, latitude = $6, longitude = $7 WHERE id = $8 RETURNING *',
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

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Кав'ярню не знайдено для оновлення" });
        }
        cache.del('all_shops_api');


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
        cache.del('all_shops_api');
        res.status(200).json({ message: "Кав'ярню успішно видалено", deletedShop: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при видаленні", details: err.message });
    }

};

exports.getShopsPaginated = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 5; 
        const skip = parseInt(req.query.skip) || 0;   

        const countResult = await db.query('SELECT COUNT(*) FROM shops');
        const totalCount = parseInt(countResult.rows[0].count);

        const result = await db.query(
            'SELECT id, name, address, description, image_url, latitude, longitude FROM shops ORDER BY id DESC LIMIT $1 OFFSET $2',
            [limit, skip]
        );

       
        let nextLink = null;
        if (skip + limit < totalCount) {
            const nextSkip = skip + limit;
            nextLink = `${req.protocol}://${req.get('host')}/api/shops/paginated?skip=${nextSkip}&limit=${limit}`;
        }

        
        res.json({
            total: totalCount,
            limit: limit,
            skip: skip,
            nextLink: nextLink,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при отриманні посторінкових даних" });
    }
};