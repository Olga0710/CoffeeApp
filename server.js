const express = require('express');
const http = require('http');
const { WebSocket, WebSocketServer } = require('ws');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const db = require('./models/db');
const app = express();
const PORT = process.env.PORT || 3000;

// Створюємо HTTP-сервер на базі Express та ініціалізуємо WebSocket (Вимога C10)
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Зберігаємо підключених клієнтів для розсилки оновлень у реальному часі
const clients = new Set();
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('🔗 Клієнт підключився через WebSocket (Вимога C10)');

    ws.send(JSON.stringify({ type: 'WELCOME', message: "З'єднано з сервером Zruchno Coffee!" }));

    // ДОДАЄМО ОБРОБКУ ПОВІДОМЛЕНЬ ДЛЯ C18 (Спільна дошка / малювання)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (e) {
            console.error('Помилка обробки WebSocket повідомлення:', e);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        if (process.env.NODE_ENV !== 'test') {
            console.log('❌ Клієнт відключився від WebSocket');
        };
    });
});

// Функція для broadcast-розсилки оновлень
function broadcastUpdate(data) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Експортуємо функцію розсилки та сервер
module.exports = { app, server, broadcastUpdate };

// Імпорт контролерів
const shopController = require('./controllers/shopController');
const menuController = require('./controllers/menuController');
const categoryController = require('./controllers/categoryController');
const shopApiController = require('./controllers/api/shopApiController');
const categoryApiController = require('./controllers/api/categoryApiController');
const menuApiController = require('./controllers/api/menuApiController');
const agentController = require('./controllers/api/agentController');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// НАЛАШТУВАННЯ OAUTH2 АВТЕНТИФІКАЦІЇ
app.use(session({
    secret: 'zruchno_coffee_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';

        // FEATURE FLAG 
        const isPremiumUser = email === 'olga.berezhnaya20006@gmail.com' || email.includes('admin');

        const user = {
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            isPremium: isPremiumUser // Флаг доступу
        };
        return done(null, user);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middleware для передачі об'єкта користувача у всі EJS шаблони
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// --- FEATURE FLAG / PREMIUM MIDDLEWARE (Вимога B6) ---
function requirePremium(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.isPremium) {
        return next();
    }
    res.status(403).render('shops/error', {
        message: 'Ця функція (Преміум-розділ) доступна лише для користувачів з Premium-тарифом! ☕'
    });
}

// --- МАРШРУТИ АВТЕНТИФІКАЦІЇ ---
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/shops' }),
    (req, res) => {
        res.redirect('/shops');
    }
);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/shops');
    });
});

// --- ОСНОВНІ МАРШРУТИ ---
app.get('/', (req, res) => res.redirect('/shops'));
app.get('/shops', shopController.getAllShops);
app.get('/shops/create', shopController.getCreateShopForm);
app.post('/shops', shopController.createShop);
app.post('/shops/delete/:id', shopController.deleteShop);
app.get('/shops/edit/:id', shopController.getEditShopForm);
app.post('/shops/edit/:id', shopController.updateShop);

app.get('/shops/:shopId/categories', categoryController.getShopCategories);
app.get('/shops/:shopId/categories/create', categoryController.getCreateForm);
app.post('/shops/:shopId/categories', categoryController.createCategory);
app.post('/shops/:shopId/categories/delete/:id', categoryController.deleteCategory);
app.get('/shops/:shopId/categories/edit/:id', categoryController.getEditCategoryForm);
app.post('/shops/:shopId/categories/edit/:id', categoryController.updateCategory);

app.get('/shops/:shopId/menu', menuController.getShopMenu);
app.post('/shops/:shopId/menu', menuController.addMenuItem);
app.get('/shops/:shopId/menu/edit/:itemId', menuController.getEditMenuItemForm);
app.post('/shops/:shopId/menu/edit/:itemId', menuController.updateMenuItem);
app.post('/shops/:shopId/menu/delete/:itemId', menuController.deleteMenuItem);

// API маршрути
app.get('/api/shops/paginated', shopApiController.getShopsPaginated);
app.get('/api/shops', shopApiController.getAllShops);
app.get('/api/shops/:id', shopApiController.getShopById);
app.post('/api/shops', shopApiController.createShop);
app.put('/api/shops/:id', shopApiController.updateShop);
app.delete('/api/shops/:id', shopApiController.deleteShop);

app.get('/api/categories/search', categoryApiController.searchCategories);
app.get('/api/shops/:shopId/categories', categoryApiController.getShopCategories);
app.post('/api/shops/:shopId/categories', categoryApiController.createCategory);
app.put('/api/categories/:id', categoryApiController.updateCategory);
app.delete('/api/categories/:id', categoryApiController.deleteCategory);

app.get('/api/shops/:shopId/menu', menuApiController.getShopMenu);
app.post('/api/shops/:shopId/menu', menuApiController.addMenuItem);
app.put('/api/menu/:itemId', menuApiController.updateMenuItem);
app.delete('/api/menu/:itemId', menuApiController.deleteMenuItem);

app.post('/api/agent/chat', agentController.chatWithAgent);
app.get('/api/agent/chat', agentController.chatWithAgent);

app.get('/map', (req, res) => res.render('shops/map'));
app.get('/chat', (req, res) => res.render('shops/chat'));
app.get('/notes', (req, res) => res.render('notes'));
app.get('/benchmark', (req, res) => {
    res.render('benchmark');
});
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

// Захищений роут за допомогою Feature Flag / Premium доступу (Вимога B6)
app.get('/game', requirePremium, (req, res) => {
    res.render('game');
});

// Динамічний Frequent Polling з рахунком кав'ярень із БД
app.get('/api/benchmark/shops', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) FROM shops');
        const count = result.rows[0].count;
        res.json({
            success: true,
            message: `Frequent Poll: Каталог перевірено, активних кав'ярень — ${count}`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Помилка отримання даних' });
    }
});

// Динамічний Long Polling з рахунком позицій меню з таблиці menu_items
app.get('/api/benchmark/long-poll', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) FROM menu_items');
        const count = result.rows[0].count;
        setTimeout(() => {
            res.json({
                success: true,
                message: `Long Poll: Синхронізовано стан меню (всього страв/напоїв: ${count})`
            });
        }, 1500);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Помилка Long Polling' });
    }
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🚀 Сервер (MVC + WebSockets) працює на http://localhost:${PORT}`);
    });
}