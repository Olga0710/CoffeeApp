const request = require('supertest');
const app = require('../server');

describe('C5: REST API & JSON CRUD Tests', () => {

    let createdShopId;

    test('GET /api/shops should return 200 and a JSON array of shops', async () => {
        const response = await request(app).get('/api/shops');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    
    test('POST /api/shops with valid JSON should create a shop and return status 201/200', async () => {
        const newShop = {
            name: "Тестова Кав'ярня C5",
            description: "Перевірка API",
            address: "вул. Хрещатик, 2",
            opening_hours: "08:00 - 22:00",
            image_url: "https://example.com/shop.jpg"
        };

        const response = await request(app)
            .post('/api/shops')
            .send(newShop);


        expect([200, 201]).toContain(response.status);
        expect(response.headers['content-type']).toMatch(/json/);

       
        if (response.body && response.body.id) {
            createdShopId = response.body.id;
        }
    });

    
    test('GET /api/shops/999999 should return 4xx error status and JSON error message', async () => {
        const response = await request(app).get('/api/shops/999999');

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toHaveProperty('error');
    });

   
    test('POST /api/shops with invalid/empty JSON body should return 4xx status', async () => {
        const response = await request(app)
            .post('/api/shops')
            .send({}); 

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.headers['content-type']).toMatch(/json/);
    });

});