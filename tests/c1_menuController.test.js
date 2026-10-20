const request = require('supertest');
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

jest.mock('../models/db', () => ({
    query: jest.fn()
}));

const db = require('../models/db');
const menuController = require('../controllers/menuController');


app.get('/shops/:shopId/menu', menuController.getShopMenu);
app.post('/shops/:shopId/menu', menuController.addMenuItem);
app.post('/shops/:shopId/menu/delete/:itemId', menuController.deleteMenuItem);

app.set('view engine', 'ejs');

describe('☕ Menu Controller & CRUD (C1 Requirements)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Отримання меню кавʼярні з категоріями та товарами (GET /shops/:shopId/menu)', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Zruchno Coffee', address: 'Хрещатик, 1' }] }) 
            .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Кава' }, { id: 11, name: 'Десерти' }] }) 
            .mockResolvedValueOnce({
                rows: [
                    { id: 100, shop_id: 1, category_id: 10, name: 'Лате', price: 85, image_url: 'https://example.com/latte.jpg' }
                ]
            }); // Menu Items

        const response = await request(app).get('/shops/1/menu');

        expect(response.status).toBe(200);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM shops WHERE id = $1', ['1']);
    });

    test('2. Додавання нового товару з посиланням на файл/фото (POST /shops/:shopId/menu) - Вимога C1', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 1 });

        const newItem = {
            category_id: 10,
            name: 'Флєт Вайт',
            description: 'Подвійний еспресо з молоком',
            price: 95,
            image_url: 'https://example.com/flatwhite.jpg'
        };

        const response = await request(app)
            .post('/shops/1/menu')
            .send(newItem);

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/shops/1/menu');

       
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO menu_items'),
            expect.any(Array)
        );
    });

    test('3. Видалення товару (CRUD - Delete) (POST /shops/:shopId/menu/delete/:itemId)', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 1 });

        const response = await request(app).post('/shops/1/menu/delete/100');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/shops/1/menu');

        expect(db.query).toHaveBeenCalledWith(
            'DELETE FROM menu_items WHERE id = $1',
            ['100']
        );
    });

    test('4. Обробка помилки, якщо кавʼярню не знайдено (404 Not Found)', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app).get('/shops/999/menu');

        expect(response.status).toBe(404);
        expect(response.text).toContain("Кав'ярню не знайдено");
    });

});