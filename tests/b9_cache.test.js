const request = require('supertest');
const app = require('../server');
const cache = require('../services/cache');

describe('API Shop Caching & Invalidation (Lab B9)', () => {

    beforeEach(() => {
        cache.flushAll();
    });

    test('Перший запит — database, другий — cache', async () => {
        // 1. Перший запит (Cache Miss -> запит до бази)
        const res1 = await request(app).get('/api/shops');
        expect(res1.status).toBe(200);
        expect(res1.body.source).toBe('database');
        expect(Array.isArray(res1.body.data)).toBe(true);

        // 2. Другий запит поспіль (Cache Hit -> з пам'яті)
        const res2 = await request(app).get('/api/shops');
        expect(res2.status).toBe(200);
        expect(res2.body.source).toBe('cache');
        expect(res2.body.data).toEqual(res1.body.data);
    });

    test('Кеш повинен інвалідуватися при створенні (POST)', async () => {
        // 1. Зберігаємо дані в кеш
        await request(app).get('/api/shops');

        // 2. Створюємо новий запис (викликає cache.del)
        await request(app)
            .post('/api/shops')
            .send({ name: 'Тестова кавʼярня', address: 'Хрещатик 1' });

        // 3. Наступний запит має знову піти в базу ('database')
        const resAfterPost = await request(app).get('/api/shops');
        expect(resAfterPost.body.source).toBe('database');
    });

    test('Кеш повинен інвалідуватися при видаленні (DELETE)', async () => {
        // 1. Створюємо запис для видалення
        const newShop = await request(app)
            .post('/api/shops')
            .send({ name: 'Кавʼярня на видалення', address: 'Тестова 2' });

        const shopId = newShop.body.shop ? newShop.body.shop.id : 1;

        // 2. Зберігаємо список у кеш
        await request(app).get('/api/shops');

        // 3. Видаляємо кав'ярню (викликає cache.del)
        await request(app).delete(`/api/shops/${shopId}`);

        // 4. Наступний запит має знову піти в базу ('database')
        const resAfterDelete = await request(app).get('/api/shops');
        expect(resAfterDelete.body.source).toBe('database');
    });
});