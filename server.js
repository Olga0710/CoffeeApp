const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const shopController = require('./controllers/shopController');
const menuController = require('./controllers/menuController');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.redirect('/shops'));
app.get('/shops', shopController.getAllShops);
app.get('/shops/create', shopController.getCreateForm);
app.post('/shops', shopController.createShop);
app.post('/shops/delete/:id', shopController.deleteShop);
app.get('/shops/edit/:id', shopController.getEditForm);
app.post('/shops/edit/:id', shopController.updateShop);
app.get('/shops/:id/menu', menuController.getShopMenu);
app.post('/shops/:id/menu', menuController.addMenuItem);
app.get('/shops/:shopId/menu/edit/:itemId', menuController.getEditMenuItemForm);
app.post('/shops/:shopId/menu/edit/:itemId', menuController.updateMenuItem);
app.post('/shops/:shopId/menu/delete/:itemId', menuController.deleteMenuItem);

app.listen(PORT, () => {
    console.log(`MVC Сервер працює на http://localhost:${PORT}`);
});