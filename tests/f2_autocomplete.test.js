
jest.mock('../models/db', () => ({
    query: jest.fn(),
}));


const request = require('supertest');
const app = require('../server');
const db = require('../models/db');

describe('F2: Тестування AJAX-пошуку (Autocomplete API)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Повинен повернути порожній масив, якщо введено менше 3 символів (перевірка minLength: 3)', async () => {
        const response = await request(app).get('/api/categories/search?q=ka');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
        expect(db.query).not.toHaveBeenCalled();
    });

    test('2. Повинен повернути результати з бази даних, якщо введено 3 або більше символів', async () => {
        const mockCategories = [
            { id: 1, name: 'Кава зернова' },
            { id: 5, name: 'Кавові напої' }
        ];

        db.query.mockResolvedValueOnce({ rows: mockCategories });

        const response = await request(app).get('/api/categories/search?q=кав');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCategories);
        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
            'SELECT id, name FROM categories WHERE name ILIKE $1 LIMIT 20',
            ['%кав%']
        );
    });

    test('3. Повинен повернути статус 500 при помилці бази даних', async () => {
        db.query.mockRejectedValueOnce(new Error('Database connection failed'));

        const response = await request(app).get('/api/categories/search?q=latte');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Помилка сервера' });
    });
});