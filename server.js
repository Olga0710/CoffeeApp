const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const shopController = require('./controllers/shopController');
const menuController = require('./controllers/menuController');
const categoryController = require('./controllers/categoryController');


const shopApiController = require('./controllers/api/shopApiController');
const categoryApiController = require('./controllers/api/categoryApiController');
const menuApiController = require('./controllers/api/menuApiController');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.redirect('/shops'));

app.get('/shops', shopController.getAllShops);
app.get('/shops/create', shopController.getCreateShopForm);
app.post('/shops', shopController.createShop);
app.post('/shops/delete/:id', shopController.deleteShop);
app.get('/shops/edit/:id', shopController.getEditShopForm);
app.post('/shops/edit/:id', shopController.updateShop);

app.get('/api/shops', shopApiController.getAllShops);
app.get('/api/shops/:id', shopApiController.getShopById);
app.post('/api/shops', shopApiController.createShop);
app.put('/api/shops/:id', shopApiController.updateShop);

app.get('/shops/:shopId/categories', categoryController.getShopCategories);
app.get('/shops/:shopId/categories/create', categoryController.getCreateForm);
app.post('/shops/:shopId/categories', categoryController.createCategory);
app.post('/shops/:shopId/categories/delete/:id', categoryController.deleteCategory);
app.get('/shops/:shopId/categories/edit/:id', categoryController.getEditCategoryForm);
app.post('/shops/:shopId/categories/edit/:id', categoryController.updateCategory);

app.get('/api/shops/:shopId/categories', categoryApiController.getShopCategories);
app.post('/api/shops/:shopId/categories', categoryApiController.createCategory);
app.put('/api/categories/:id', categoryApiController.updateCategory);
app.delete('/api/categories/:id', categoryApiController.deleteCategory);


app.get('/shops/:shopId/menu', menuController.getShopMenu);
app.post('/shops/:shopId/menu', menuController.addMenuItem);
app.get('/shops/:shopId/menu/edit/:itemId', menuController.getEditMenuItemForm);
app.post('/shops/:shopId/menu/edit/:itemId', menuController.updateMenuItem);
app.post('/shops/:shopId/menu/delete/:itemId', menuController.deleteMenuItem);

app.get('/api/shops/:shopId/menu', menuApiController.getShopMenu);
app.post('/api/shops/:shopId/menu', menuApiController.addMenuItem);
app.put('/api/menu/:itemId', menuApiController.updateMenuItem);
app.delete('/api/menu/:itemId', menuApiController.deleteMenuItem);

app.listen(PORT, () => {
    console.log(`MVC Сервер працює на http://localhost:${PORT}`);
});