const request = require('supertest');
const express = require('express');
const agentController = require('../controllers/api/agentController'); 

const app = express();
app.use(express.json());
app.get('/api/agent/chat', agentController.chatWithAgent);
app.post('/api/agent/chat', agentController.chatWithAgent);

describe('GET /api/agent/chat - ШІ-агент (SSE Streaming та Tool Calling)', () => {

    test('Має повертати помилку 200 та SSE заголовки при порожньому повідомленні', async () => {
        const response = await request(app)
            .get('/api/agent/chat')
            .query({ message: '' });

        expect(response.headers['content-type']).toMatch(/text\/event-stream/);
        expect(response.headers['cache-control']).toContain('no-cache');

        
        expect(response.text).toContain('Повідомлення не може бути порожнім.');
    });

    test('Має успішно обробляти пошук меню та повертати SSE події (status, chunk, done)', async () => {
       
        jest.setTimeout(10000);

        const response = await request(app)
            .get('/api/agent/chat')
            .query({ message: 'Матча' });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/text\/event-stream/);

        expect(response.text).toContain('🧠 ШІ-агент аналізує наміри');
        expect(response.text).toContain('🛠️ Tool Calling [query_database]');

        expect(response.text).toContain('type":"chunk"');
        expect(response.text).toContain('type":"done"');
    });

    test('Має розпізнавати інтент пошуку кавʼярні (shop) та повертати адресу', async () => {
        const response = await request(app)
            .post('/api/agent/chat')
            .send({ message: 'Де знайти кавʼярню?' });

        expect(response.status).toBe(200);
        expect(response.text).toContain('тип: shop');
        expect(response.text).toContain('type":"done"');
    });

});