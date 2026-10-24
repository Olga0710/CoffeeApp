const request = require('supertest');
const app = require('../server'); // Шлях до твого сервера

describe('F1: Statistics & Visualization Data API Tests', () => {

    test('GET /api/shops should return valid shops array for chart labels', async () => {
        const response = await request(app).get('/api/shops');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

       
        response.body.forEach(shop => {
            expect(shop).toHaveProperty('id');
            expect(shop).toHaveProperty('name');
        });
    });

    test('GET /api/shops/:id/menu should provide numeric prices for statistical calculations', async () => {
        const shopsResponse = await request(app).get('/api/shops');
        const shops = shopsResponse.body;

        if (shops && shops.length > 0) {
            const shopId = shops[0].id;
            const menuResponse = await request(app).get(`/api/shops/${shopId}/menu`);

            expect(menuResponse.status).toBe(200);

            const menuItems = Array.isArray(menuResponse.body)
                ? menuResponse.body
                : (menuResponse.body.data || []);

            expect(Array.isArray(menuItems)).toBe(true);

           
            menuItems.forEach(item => {
                expect(item).toHaveProperty('price');
                const priceNum = Number(item.price);
                expect(isNaN(priceNum)).toBe(false);
                expect(priceNum).toBeGreaterThanOrEqual(0);
            });
        }
    });

    test('Should successfully simulate frontend statistics calculation logic', async () => {
        const shopsResponse = await request(app).get('/api/shops');
        const shops = shopsResponse.body;

        if (shops && shops.length > 0) {
            const shopId = shops[0].id;
            const menuResponse = await request(app).get(`/api/shops/${shopId}/menu`);
            const menuItems = Array.isArray(menuResponse.body) ? menuResponse.body : (menuResponse.body.data || []);

           
            const menuCount = menuItems.length;
            let avgPrice = 0;

            if (menuCount > 0) {
                const totalPrice = menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
                avgPrice = Number((totalPrice / menuCount).toFixed(2));
            }

            
            expect(typeof menuCount).toBe('number');
            expect(typeof avgPrice).toBe('number');
            expect(isNaN(avgPrice)).toBe(false);
        }
    });

});