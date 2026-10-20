const request = require('supertest');
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ДОДАНО: налаштування рушія шаблонів для Express у тестах
app.set('view engine', 'ejs');

jest.mock('../models/db', () => ({
    query: jest.fn()
}));

const db = require('../models/db');
const shopController = require('../controllers/shopController');


app.get('/shops', shopController.getAllShops);
app.post('/shops', shopController.createShop);

describe('Shop Controller Testing', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Отримання списку всіх кавʼярень (GET /shops)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [
                { id: 1, name: 'Zruchno Coffee', address: 'Київ, Хрещатик 1', image_url: 'https://example.com/shop.jpg' }
            ]
        });

        const response = await request(app).get('/shops');
        expect(response.status).toBe(200);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM shops'));
    });

    test('2. Створення нової кавʼярні (POST /shops)', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 1 });

        const newShop = {
            name: 'Coffee House',
            address: 'Київ, Подол',
            opening_hours: '08:00 - 22:00',
            description: 'Затишна кавʼярня',
            image_url: 'https://example.com/coffee.jpg'
        };

        const response = await request(app)
            .post('/shops')
            .send(newShop);

        expect(response.status).toBe(302);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO shops'),
            expect.any(Array)
        );
    });
});