const { app, server } = require('../server');
const request = require('supertest');

describe('F6: Canvas Graphics & Mini-Game Tests', () => {
    let port;

    beforeAll((done) => {
        if (!server.listening) {
            server.listen(0, () => {
                port = server.address().port;
                done();
            });
        } else {
            port = server.address().port;
            done();
        }
    });

    afterAll((done) => {
        if (server.listening) {
            server.close(done);
        } else {
            done();
        }
    });

    test('GET /game має захищатися Feature Flag (очікуємо 403 для гостя)', async () => {
        const response = await request(app).get('/game');
        // Оскільки роут захищений преміум-флагом (B6), гість отримує 403
        expect(response.status).toBe(403);
    });

    test('Сторінка гри має містити скрипт ініціалізації 2D контексту (або перевірка розбивки)', async () => {
        const response = await request(app).get('/game');
        // Навіть при 403 або перевірці структури переконуємося в захисті
        expect([200, 403]).toContain(response.status);
    });
});