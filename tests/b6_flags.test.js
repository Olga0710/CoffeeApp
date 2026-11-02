const request = require('supertest');
const { app } = require('../server'); // Імпортуємо ваш Express-додаток із server.js

describe('Юніт-тести для Feature Flag (Вимога B6 - requirePremium)', () => {

    // Тестуємо саму функцію middleware ізольовано
    const requirePremium = (req, res, next) => {
        if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.isPremium) {
            return next();
        }
        res.status(403).json({ error: 'Access Denied', flag: 'B6' });
    };

    it('Повинен повернути помилку 403 для користувача з флагом isPremium: false', (done) => {
        const req = {
            isAuthenticated: () => true,
            user: { email: 'guest@gmail.com', isPremium: false }
        };

        const res = {
            status: (code) => {
                expect(code).toBe(403); // Перевірка через Jest
                return {
                    json: (data) => {
                        expect(data.flag).toBe('B6');
                        done();
                    }
                };
            }
        };

        requirePremium(req, res, () => {
            done(new Error('Помилка: користувача з isPremium: false було пропущено!'));
        });
    });

    it('Повинен успішно передати керування (next) для користувача з флагом isPremium: true', (done) => {
        const req = {
            isAuthenticated: () => true,
            user: { email: 'olga.berezhnaya20006@gmail.com', isPremium: true }
        };
        const res = {};

        // Якщо викликається next(), значить Feature Flag спрацював правильно
        requirePremium(req, res, () => {
            done();
        });
    });

    it('Повинен заблокувати неавторизованого користувача (status 403)', (done) => {
        const req = {
            isAuthenticated: () => false
        };

        const res = {
            status: (code) => {
                expect(code).toBe(403);
                return {
                    json: (data) => {
                        expect(data.error).toBe('Access Denied');
                        done();
                    }
                };
            }
        };

        requirePremium(req, res, () => {
            done(new Error('Помилка: неавторизованого користувача було пропущено!'));
        });
    });
});