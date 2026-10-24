const shopApiController = require('../controllers/api/shopApiController');
const db = require('../models/db');

jest.mock('../models/db');

describe('Юніт-тест для Pagination API (Вимога B1)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getShopsPaginated має повертати правильні метадані, дані та nextLink', async () => {
        const req = {
            query: { skip: '0', limit: '2' },
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:3000')
        };

      
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        
        db.query.mockResolvedValueOnce({ rows: [{ count: '4' }] });
      
        db.query.mockResolvedValueOnce({
            rows: [
                { id: 2, name: 'ONE LOVE coffee', address: 'вул. Велика Васильківська, 100' },
                { id: 25, name: 'Тоторо кава', address: 'вул. Мишуги, 12-А' }
            ]
        });

       
        await shopApiController.getShopsPaginated(req, res);

       
        expect(res.json).toHaveBeenCalledWith({
            total: 4,
            limit: 2,
            skip: 0,
            nextLink: 'http://localhost:3000/api/shops/paginated?skip=2&limit=2',
            data: [
                { id: 2, name: 'ONE LOVE coffee', address: 'вул. Велика Васильківська, 100' },
                { id: 25, name: 'Тоторо кава', address: 'вул. Мишуги, 12-А' }
            ]
        });
    });
});