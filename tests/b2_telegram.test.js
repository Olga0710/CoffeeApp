const { createShop, updateShop, deleteShop } = require('../controllers/shopController');
const db = require('../models/db');

describe('Telegram Integration Unit Tests (B2 - CRUD)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Мокуємо глобальний fetch, щоб запити нікуди не летіли, а успішно перехоплювалися Jest
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true })
        });
    });

    test('успішно надсилає сповіщення про створення кав\'ярні', async () => {
        jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] });

        const req = {
            body: {
                name: 'Test Coffee Create',
                description: 'Good coffee',
                address: 'Khreshchatyk 1',
                opening_hours: '08:00 - 20:00',
                latitude: 50.4501,
                longitude: 30.5234
            }
        };
        const res = { redirect: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };

        await createShop(req, res);

        // Перевіряємо, що fetch дійсно викликався для відправки в Telegram
        expect(global.fetch).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/shops');
    });

    test('успішно надсилає сповіщення про оновлення кав\'ярні', async () => {
        jest.spyOn(db, 'query')
            .mockResolvedValueOnce({ rows: [{ latitude: 50.4501, longitude: 30.5234 }] })
            .mockResolvedValueOnce({ rows: [] });

        const req = {
            params: { id: 1 },
            body: {
                name: 'Test Coffee Updated',
                address: 'Khreshchatyk 2',
                opening_hours: '09:00 - 22:00',
                latitude: 50.4501,
                longitude: 30.5234
            }
        };
        const res = { redirect: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };

        await updateShop(req, res);

        expect(global.fetch).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/shops');
    });

    test('успішно надсилає сповіщення про видалення кав\'ярні', async () => {
        jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] });

        const req = {
            params: { id: 1 }
        };
        const res = { redirect: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };

        await deleteShop(req, res);

        expect(global.fetch).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/shops');
    });
});