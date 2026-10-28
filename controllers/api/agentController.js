const db = require('../../models/db');

const chatWithAgent = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    const message = req.query.message || req.body?.message || '';

    try {
        if (!message.trim()) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: 'Повідомлення не може бути порожнім.' })}\n\n`);
            res.end();
            return;
        }

        res.write(`data: ${JSON.stringify({ type: 'status', content: '🧠 ШІ-агент аналізує наміри та категорії меню...' })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 300));

        const lowerMsg = message.toLowerCase();

        let searchTerm = '';
        let targetPrice = null;
        let priceOperator = '<=';
        let intentType = 'menu';

        if (
            lowerMsg.includes('кав\'ярн') ||
            lowerMsg.includes('адрес') ||
            lowerMsg.includes('де знайти') ||
            lowerMsg.includes('заклад')
        ) {
            intentType = 'shop';
            searchTerm = message.replace(/(знайди|список|покажи|напої|напій|чи є|чи маєте|у вас є|є у вас|мені|позиції|з|із|категорії|категорія|дешевше|дорожче|до|від|грн|гривень|\?|\!|\.|,|\d+)/gi, '').trim();
        } else {
            intentType = 'menu';
            const priceMatch = message.match(/(\d+)/);
            if (priceMatch) {
                targetPrice = parseInt(priceMatch[1], 10);
            }

            if (lowerMsg.includes('дорожче') || lowerMsg.includes('від') || lowerMsg.includes('>')) {
                priceOperator = '>=';
            } else {
                priceOperator = '<=';
            }

            searchTerm = message.replace(/(знайди|список|покажи|напої|напій|чи є|чи маєте|у вас є|мені|позиції|з|із|категорії|категорія|дешевше|дорожче|до|від|грн|гривень|\d+)/gi, '').trim();
        }

        const displayTerm = searchTerm || 'всі';
        res.write(`data: ${JSON.stringify({
            type: 'status',
            content: `🛠️ Tool Calling [query_database]: пошук (тип: ${intentType}, термін: "${displayTerm}")`
        })}\n\n`);

        let dbQuery = '';
        let queryParams = [];

        if (intentType === 'menu') {
            let conditions = [];
            let paramIndex = 1;

            if (searchTerm && searchTerm.length > 0) {
                // Шукаємо за повним входженням терміну в назву, опис або категорію
                conditions.push(`(m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
                queryParams.push(`%${searchTerm}%`);
                paramIndex++;
            }

            if (targetPrice !== null) {
                conditions.push(`m.price ${priceOperator} $${paramIndex}`);
                queryParams.push(targetPrice);
                paramIndex++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            dbQuery = `
                SELECT m.name as item_name, m.price, s.name as shop_name, s.address, c.name as category_name 
                FROM menu_items m 
                JOIN shops s ON m.shop_id = s.id 
                LEFT JOIN categories c ON m.category_id = c.id
                ${whereClause} 
                LIMIT 5
            `;
        } else {
            dbQuery = `
                SELECT name, address, description FROM shops 
                WHERE name ILIKE $1 OR address ILIKE $1 
                LIMIT 5
            `;
            queryParams = [`%${searchTerm || ''}%`];
        }

        const dbResult = await db.query(dbQuery, queryParams);
        await new Promise(resolve => setTimeout(resolve, 400));

        let toolResultsText = '';
        if (dbResult.rows.length > 0) {
            if (intentType === 'menu') {
                const itemsList = dbResult.rows
                    .map(m => `«${m.item_name}» [${m.category_name || 'Меню'}] — ${m.price} грн у закладі "${m.shop_name}" (${m.address})`)
                    .join('; ');
                toolResultsText = ` Знайшов у каталозі: ${itemsList}.`;
            } else {
                const shopsList = dbResult.rows
                    .map(s => `«${s.name}» (адреса: ${s.address})`)
                    .join(', ');
                toolResultsText = ` Знайшов заклади: ${shopsList}.`;
            }
        } else {
            toolResultsText = ' На жаль, за вашим запитом нічого не знайдено.';
        }

        res.write(`data: ${JSON.stringify({ type: 'status', content: '✍️ Формую відповідь...' })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 200));

        const baseReply = `Привіт! Я ваш ШІ-бариста ZruchnoCoffee.${toolResultsText} Чим ще можу допомогти?`;

        const words = baseReply.split(' ');
        for (let i = 0; i < words.length; i++) {
            const chunkText = words[i] + ' ';
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 25));
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

    } catch (err) {
        console.error('Помилка агента:', err);
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Сталася помилка на сервері.' })}\n\n`);
        res.end();
    }
};

exports.chatWithAgent = chatWithAgent;