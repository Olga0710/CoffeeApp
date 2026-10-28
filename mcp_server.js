import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import db from "../models/db.js"; // Ваше підключення до бази даних PostgreSQL

// Створюємо екземпляр MCP сервера
const server = new Server(
    {
        name: "zruchno-coffee-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 1. Оголошуємо інструменти (3 на читання, 1 на запис)
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // --- ЧИТАННЯ 1: Отримати список кав'ярень ---
            {
                name: "get_shops",
                description: "Отримати список усіх кав'ярень у мережі ZruchnoCoffee",
                inputSchema: { type: "object", properties: {} },
            },
            // --- ЧИТАННЯ 2: Пошук позицій у меню ---
            {
                name: "search_menu",
                description: "Шукати позиції в меню за назвою або описом",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Пошуковий термін (наприклад, матча, лате)" }
                    },
                    required: ["query"],
                },
            },
            // --- ЧИТАННЯ 3: Отримати категорії ---
            {
                name: "get_categories",
                description: "Отримати список усіх категорій меню",
                inputSchema: { type: "object", properties: {} },
            },
            // --- ЗАПИС 1: Додати новий товар до меню ---
            {
                name: "add_menu_item",
                description: "Додати нову позицію до меню кав'ярні (Write tool)",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Назва продукту" },
                        price: { type: "number", description: "Ціна у гривнях" },
                        shop_id: { type: "number", description: "ID кав'ярні" },
                        category_id: { type: "number", description: "ID категорії (необов'язково)" }
                    },
                    required: ["name", "price", "shop_id"],
                },
            },
        ],
    };
});

// 2. Логіка виконання інструментів (Tool Execution)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_shops") {
            const result = await db.query("SELECT id, name, address, description FROM shops");
            return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
        }

        if (name === "search_menu") {
            const queryTerm = `%${args.query}%`;
            const result = await db.query(
                `SELECT m.name, m.price, s.name as shop_name 
                 FROM menu_items m 
                 JOIN shops s ON m.shop_id = s.id 
                 WHERE m.name ILIKE $1 OR m.description ILIKE $1`,
                [queryTerm]
            );
            return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
        }

        if (name === "get_categories") {
            const result = await db.query("SELECT * FROM categories");
            return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
        }

        if (name === "add_menu_item") {
            const result = await db.query(
                `INSERT INTO menu_items (name, price, shop_id, category_id) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [args.name, args.price, args.shop_id, args.category_id || null]
            );
            return {
                content: [{ type: "text", text: `Успішно додано товар через MCP: ${JSON.stringify(result.rows[0])}` }]
            };
        }

        throw new Error(`Невідомий інструмент: ${name}`);
    } catch (error) {
        return {
            content: [{ type: "text", text: `Помилка виконання: ${error.message}` }],
            isError: true,
        };
    }
});

// 3. Запуск сервера через стандартний транспорт (stdio)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ZruchnoCoffee MCP Server успішно запущено");
}

main().catch((error) => {
    console.error("Помилка запуску MCP сервера:", error);
    process.exit(1);
});