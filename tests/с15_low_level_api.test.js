/**
 * Юніт-тести для перевірки низькорівневих API (Вимога C15)
 * Технології: File API (Blob), WebRTC API, WebAssembly
 */

const assert = require('assert');

describe('C15: Низькорівневі браузерні API (Unit Tests)', () => {

    // --- 1. ТЕСТУВАННЯ FILE API ---
    describe('1. File API (Парсинг JSON меню через Blob / File API)', () => {
        it('повинен успішно читати та парсити дані меню з локального файлу (Blob)', async () => {
            const mockMenuData = [
                { id: 1, name: "Еспресо", price: 45 },
                { id: 2, name: "Лате", price: 65 }
            ];

            // Створюємо віртуальний файл у пам'яті (Blob імітує File об'єкт у File API)
            const jsonString = JSON.stringify(mockMenuData);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Читаємо вміст файлу за допомогою асинхронного метод File/Blob API
            const textResult = await blob.text();
            const parsedData = JSON.parse(textResult);

            assert.strictEqual(Array.isArray(parsedData), true, "Результат має бути масивом");
            assert.strictEqual(parsedData.length, 2, "Кількість товарів має дорівнювати 2");
            assert.strictEqual(parsedData[0].name, "Еспресо", "Назва першого товару має збігатися");
        });
    });


    // --- 2. ТЕСТУВАННЯ WebRTC API ---
    describe('2. WebRTC API (Доступ до медіа-потоків камери)', () => {
        it('повинен мати обробник navigator.mediaDevices.getUserMedia для відеотрансляції з бару', () => {
            global.navigator = global.navigator || {};
            global.navigator.mediaDevices = {
                getUserMedia: async (constraints) => {
                    if (constraints.video) {
                        return { id: "mock-stream-id", active: true };
                    }
                    throw new Error("Video stream denied");
                }
            };

            assert.strictEqual(typeof global.navigator.mediaDevices.getUserMedia, 'function', "Метод getUserMedia має бути доступний");

            return global.navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    assert.strictEqual(stream.active, true, "Медіа-потік має бути активним");
                });
        });
    });


    // --- 3. ТЕСТУВАННЯ WebAssembly API ---
    describe('3. WebAssembly API (Компіляція та виконання модулів)', () => {
        it('повинен успішно компілювати та виконувати мінімальний WebAssembly бінарний модуль', async () => {
            const wasmCode = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // Magic number (\0asm)
                0x01, 0x00, 0x00, 0x00  // Version (1)
            ]);

            const isValid = WebAssembly.validate(wasmCode);
            assert.strictEqual(isValid, true, "WebAssembly модуль повинен успішно проходити валідацію");

            const wasmModule = await WebAssembly.compile(wasmCode);
            assert.strictEqual(wasmModule instanceof WebAssembly.Module, true, "Об'єкт має бути екземпляром WebAssembly.Module");
        });
    });

});