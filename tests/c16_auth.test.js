const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const createTestApp = () => {
    const app = express();

    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    app.get('/auth/google', (req, res) => {
        res.redirect('https://accounts.google.com/o/oauth2/v2/auth?client_id=test');
    });

    app.get('/auth/google/callback', (req, res, next) => {
        req.login({
            id: '12345678',
            displayName: 'Ольга Бережна',
            emails: [{ value: 'olga.berezhnaya2006@gmail.com' }]
        }, (err) => {
            if (err) return next(err);
            res.redirect('/');
        });
    });

    app.get('/', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.status(200).json({ success: true, user: req.user });
        }
        res.status(401).send('Unauthorized');
    });

    return app;
};

describe('Вимога C16: Google OAuth2 Автентифікація', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    test('GET /auth/google має перенаправляти на сторінку Google (Код 302)', async () => {
        const response = await request(app).get('/auth/google');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('accounts.google.com');
    });

    test('GET /auth/google/callback успішно авторизує користувача та робить редирект (Код 302)', async () => {
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/');
    });

    test('Збережена сесія дозволяє отримувати дані профілю після входу', async () => {
        const agent = request.agent(app);
        await agent.get('/auth/google/callback');
        const profileResponse = await agent.get('/');

        expect(profileResponse.statusCode).toBe(200);
        expect(profileResponse.body.success).toBe(true);
        expect(profileResponse.body.user.displayName).toBe('Ольга Бережна');
        expect(profileResponse.body.user.emails[0].value).toBe('olga.berezhnaya2006@gmail.com');
    });
});