const { app, server, broadcastUpdate } = require('../server');
const WebSocket = require('ws');

describe('C18: Shared Dashboard & Collaborative Canvas Tests', () => {
    let port;

    beforeAll((done) => {
        // Запускаємо сервер на випадковому вільній порті для тестів
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

    test('GET /dashboard має успішно завантажувати сторінку спільної дошки (статус 200)', async () => {
        const request = require('supertest');
        const response = await request(app).get('/dashboard');

        expect(response.status).toBe(200);
    });

    test('WebSocket має ретранслювати події малювання (DRAW) між клієнтами на спільній дошці', (done) => {
        const ws1 = new WebSocket(`ws://localhost:${port}`);
        const ws2 = new WebSocket(`ws://localhost:${port}`);

        let connectedCount = 0;

        const checkReady = () => {
            connectedCount++;
            if (connectedCount === 2) {
                // Коли обидва клієнти підключилися, перший відправляє подію малювання
                ws1.send(JSON.stringify({
                    type: 'DRAW',
                    x0: 10,
                    y0: 20,
                    x1: 50,
                    y1: 60
                }));
            }
        };

        ws1.on('open', checkReady);
        ws2.on('open', checkReady);

        // Другий клієнт повинен отримати цю подію малювання
        ws2.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'DRAW') {
                expect(data.x0).toBe(10);
                expect(data.y0).toBe(20);
                expect(data.x1).toBe(50);
                expect(data.y1).toBe(60);

                ws1.close();
                ws2.close();
                done();
            }
        });
    });
});