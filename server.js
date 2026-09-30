const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const shopController = require('./controllers/shopController');
const menuController = require('./controllers/menuController');
const categoryController = require('./controllers/categoryController');

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

app.listen(PORT, () => {
    console.log(`MVC Сервер працює на http://localhost:${PORT}`);
});