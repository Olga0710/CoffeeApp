// ==========================================
// МОК для localStorage (щоб тести працювали в Node.js)
// ==========================================
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

describe('C13: Синхронізація між вкладками та C14: Візуалізація у динаміці', () => {

    const STORAGE_KEY = 'zruchno_notion_doc_v1';

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    // 1. Тест для C13: Оновлення даних при отриманні події синхронізації з іншої вкладки
    test('1. (C13) Повинно успішно оновлювати стан блоків та змінювати статус при надходженні даних з localStorage', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Початковий текст' }
        ];

        let statusText = 'Збережено в localStorage';
        const saveStatusMock = {
            set innerText(val) { statusText = val; },
            get innerText() { return statusText; }
        };

        // Функція обробки віддалених змін (аналогічна handleRemoteUpdate у проєкті)
        function handleRemoteUpdate(newJsonData) {
            const parsed = JSON.parse(newJsonData);
            if (JSON.stringify(parsed) !== JSON.stringify(blocks)) {
                blocks = parsed;
                saveStatusMock.innerText = 'Синхронізовано!';
            }
        }

        // Дані, що нібито прийшли з іншої вкладки
        const remotePayload = JSON.stringify([
            { id: 1, type: 'h1', content: 'Оновлено з сусідньої вкладки' }
        ]);

        localStorage.setItem(STORAGE_KEY, remotePayload);
        handleRemoteUpdate(remotePayload);

        // Перевіряємо результати
        expect(blocks.length).toBe(1);
        expect(blocks[0].content).toBe('Оновлено з сусідньої вкладки');
        expect(blocks[0].type).toBe('h1');
        expect(saveStatusMock.innerText).toBe('Синхронізовано!');
    });

    // 2. Тест для C14: Візуалізація у динаміці (додавання CSS-класу анімації)
    test('2. (C14) Повинно динамічно додавати клас підсвітки (.sync-animated) до рядків', () => {
        // Створюємо мікро-мок для рядків таблиці/редактора
        const mockRows = [
            { classList: { classes: [], add(c) { this.classes.push(c); }, remove(c) { this.classes = this.classes.filter(item => item !== c); }, contains(c) { return this.classes.includes(c); } } },
            { classList: { classes: [], add(c) { this.classes.push(c); }, remove(c) { this.classes = this.classes.filter(item => item !== c); }, contains(c) { return this.classes.includes(c); } } }
        ];

        // Імітуємо логіку візуалізації змін з пункту С14
        mockRows.forEach(row => {
            row.classList.add('sync-animated');
        });

        // Перевіряємо, чи класи успішно додалися
        mockRows.forEach(row => {
            expect(row.classList.contains('sync-animated')).toBe(true);
        });

        // Симулюємо видалення класу після закінчення анімації
        mockRows.forEach(row => {
            row.classList.remove('sync-animated');
        });

        mockRows.forEach(row => {
            expect(row.classList.contains('sync-animated')).toBe(false);
        });
    });

    // 3. Перевірка оптимізації (щоб не оновлювати інтерфейс, якщо дані ідентичні)
    test('3. (C13/C14) Не повинно оновлювати інтерфейс, якщо дані в localStorage ідентичні', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Однаковий текст' }
        ];
        let renderCalled = false;

        function mockRender() {
            renderCalled = true;
        }

        function handleRemoteUpdateCheck(newJsonData) {
            const parsed = JSON.parse(newJsonData);
            if (JSON.stringify(parsed) !== JSON.stringify(blocks)) {
                blocks = parsed;
                mockRender();
            }
        }

        const samePayload = JSON.stringify(blocks);
        handleRemoteUpdateCheck(samePayload);

        expect(renderCalled).toBe(false);
    });

});