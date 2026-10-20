const request = require('supertest');
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.set('view engine', 'ejs');

jest.mock('../models/db', () => ({
    query: jest.fn()
}));

const db = require('../models/db');
const categoryController = require('../controllers/categoryController');


app.get('/shops/:shopId/categories', categoryController.getShopCategories);
app.post('/shops/:shopId/categories/delete/:id', categoryController.deleteCategory);

describe('📂 Category Controller Testing', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Отримання категорій конкретного закладу (GET /shops/:shopId/categories)', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Zruchno Coffee' }] })
            .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Напої' }, { id: 11, name: 'Десерти' }] });

        const response = await request(app).get('/shops/1/categories');
        expect(response.status).toBe(200);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM categories'), ['1']);
    });

    test('2. Видалення категорії (POST /shops/:shopId/categories/delete/:id)', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 1 });

        const response = await request(app).post('/shops/1/categories/delete/10');
        expect(response.status).toBe(302);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM categories'),
            ['10']
        );
    });
});