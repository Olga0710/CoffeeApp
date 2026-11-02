const request = require('supertest');
const { app } = require('../server'); // ✅ Виправлено імпорт (деструктуризація)
const db = require('../models/db');

describe('Тестування створення кав\'ярні та геоінтеграції (Вимога C8)', () => {

    // Прибираємо або закоментовуємо db.end() у післятестовому хуку, 
    // щоб не руйнувати глобальне з'єднання з базою для інших тестів
    afterAll(async () => {
        // await db.end(); 
    });

    test('POST /shops — має успішно створити кав\'ярню та автоматично визначити/зберегти координати', async () => {
        const newShop = {
            name: "Тестова Кав'ярня C8",
            description: "Заклад для перевірки геокодування",
            address: "вулиця Хрещатик, 1, Київ",
            opening_hours: "09:00 - 20:00",
            image_url: "https://example.com/image.jpg"
        };

        const response = await request(app) // Тепер app — це валідний Express-додаток
            .post('/shops')
            .send(newShop)
            .expect(302);

        const dbResult = await db.query('SELECT * FROM shops WHERE name = $1', [newShop.name]);

        expect(dbResult.rows.length).toBe(1);
        const createdShop = dbResult.rows[0];

        expect(createdShop.latitude).not.toBeNull();
        expect(createdShop.longitude).not.toBeNull();

        expect(parseFloat(createdShop.latitude)).toBeGreaterThan(50.3);
        expect(parseFloat(createdShop.latitude)).toBeLessThan(50.6);
        expect(parseFloat(createdShop.longitude)).toBeGreaterThan(30.3);
        expect(parseFloat(createdShop.longitude)).toBeLessThan(30.8);

        // Очищаємо за собою створену тестову кав'ярню
        await db.query('DELETE FROM shops WHERE id = $1', [createdShop.id]);
    });
});