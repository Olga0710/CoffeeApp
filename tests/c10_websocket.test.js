const request = require('supertest');
const { app, server } = require('../server'); // Шлях до вашого основного файлу сервера

beforeAll((done) => {
    // Якщо сервер ще не слухає порт під час тестів, запускаємо його на вільному порті
    if (!server.listening) {
        server.listen(0, done);
    } else {
        done();
    }
});

afterAll((done) => {
    if (server.listening) {
        server.close(done); // Закриваємо сервер після завершення всіх тестів
    } else {
        done();
    }
});

describe('C10: Zruchno Coffee - Benchmark API Tests', () => {

    // 1. Тест для перевірки Frequent Polling (таблиця shops)
    test('GET /api/benchmark/shops має повертати успішний статус та кількість кав’ярень', async () => {
        const response = await request(app).get('/api/benchmark/shops');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain("Каталог перевірено, активних кав'ярень");
    });

    // 2. Тест для перевірки Long Polling (таблиця menu_items)
    test('GET /api/benchmark/long-poll має повертати статус 200 та дані меню після затримки', async () => {
        const response = await request(app).get('/api/benchmark/long-poll');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain("Синхронізовано стан меню");
    });

    // 3. Тест для перевірки рендерингу сторінки бенчмарку
    test('GET /benchmark має успішно завантажувати сторінку EJS', async () => {
        const response = await request(app).get('/benchmark');

        // Оскільки це рендер EJS, перевіряємо статус успішного відправлення сторінки
        expect(response.status).toBe(200);
    });
});