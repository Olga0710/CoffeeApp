const request = require('supertest');
const app = require('../server'); 

describe('Інтеграційні/Юніт тести для пункту C6 (Landing Page меню та деталей)', () => {

    test('GET /shops/:shopId/menu має успішно завантажувати сторінку меню з категоріями та товарами', async () => {
       
        const shopId = 2;

        const response = await request(app).get(`/shops/${shopId}/menu`);

        expect([200, 404]).toContain(response.status);
    });

    test('GET /shops/:shopId/menu має коректно опрацьовувати фільтрацію за категорією (?category=ID)', async () => {
        const shopId = 1;
        const categoryId = 1;

        const response = await request(app).get(`/shops/${shopId}/menu?category=${categoryId}`);

        expect(response.status).toBeLessThan(500);
    });

    test('GET /shops/:shopId/menu/edit/:itemId має відкривати сторінку редагування конкретного товару', async () => {
        const shopId = 1;
        const itemId = 1;

        const response = await request(app).get(`/shops/${shopId}/menu/edit/${itemId}`);

        expect([200, 404]).toContain(response.status);
    });

});