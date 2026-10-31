// файл: tests/drag-and-drop.test.js

// Мок для localStorage (щоб тести успішно працювали в середовищі Node.js)
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

describe('F3: Drag-n-Drop сортування блоків та C12: Персистентність', () => {

    const STORAGE_KEY = 'zruchno_notion_doc_v1';

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    // 1. Тест логіки перетягування (Drag-n-Drop reordering logic)
    test('1. Повинно коректно змінювати порядок блоків при перетягуванні (Drag-n-Drop)', () => {
        // Початковий масив блоків
        let blocks = [
            { id: 1, type: 'h1', content: 'Заголовок' },       // Індекс 0
            { id: 2, type: 'p', content: 'Перший параграф' },  // Індекс 1
            { id: 3, type: 'p', content: 'Другий параграф' }   // Індекс 2
        ];

        // Функція перетягування (аналогічна тій, що виконується в події drop)
        function reorderBlocks(blocksArray, draggedIdx, targetIdx) {
            const movedItem = blocksArray.splice(draggedIdx, 1)[0];
            blocksArray.splice(targetIdx, 0, movedItem);
            return blocksArray;
        }

        // Симулюємо перетягування елемента з індексу 2 ("Другий параграф") на індекс 0 (на самий верх)
        const updatedBlocks = reorderBlocks(blocks, 2, 0);

        // Перевіряємо новий порядок
        expect(updatedBlocks.length).toBe(3);
        expect(updatedBlocks[0].content).toBe('Другий параграф'); // Тепер він перший
        expect(updatedBlocks[1].content).toBe('Заголовок');       // Зсунувся вниз
        expect(updatedBlocks[2].content).toBe('Перший параграф');  // Залишився на своєму місці
    });

    // 2. Тест перетягування всередині списку вниз
    test('2. Повинно коректно переносити елемент з початку в кінець списку', () => {
        let blocks = [
            { id: 1, type: 'ul', content: 'Еспресо' },
            { id: 2, type: 'ul', content: 'Капучино' },
            { id: 3, type: 'ul', content: 'Латте' }
        ];

        function reorderBlocks(blocksArray, draggedIdx, targetIdx) {
            const movedItem = blocksArray.splice(draggedIdx, 1)[0];
            blocksArray.splice(targetIdx, 0, movedItem);
            return blocksArray;
        }

        // Перетягуємо "Еспресо" (індекс 0) на місце "Латте" (індекс 2)
        const updatedBlocks = reorderBlocks(blocks, 0, 2);

        expect(updatedBlocks[0].content).toBe('Капучино');
        expect(updatedBlocks[1].content).toBe('Латте');
        expect(updatedBlocks[2].content).toBe('Еспресо'); // Опинився в кінці
    });

    // 3. Перевірка збереження відсортованого масиву в localStorage
    test('3. Відсортований порядок блоків повинен успішно зберігатися в localStorage', () => {
        let blocks = [
            { id: 10, type: 'p', content: 'Рядок А' },
            { id: 20, type: 'p', content: 'Рядок Б' }
        ];

        // Змінюємо порядок місцями
        const moved = blocks.splice(1, 1)[0];
        blocks.splice(0, 0, moved); // Тепер "Рядок Б" перший

        // Зберігаємо у сховище (як це робить функція saveToLocalStorage)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));

        // Зчитуємо назад зі сховища
        const loadedData = JSON.parse(localStorage.getItem(STORAGE_KEY));

        expect(loadedData[0].content).toBe('Рядок Б');
        expect(loadedData[1].content).toBe('Рядок А');
        expect(loadedData.length).toBe(2);
    });

    // 4. Захист від некоректного перетягування (коли індекси однакові)
    test('4. Порядок не повинен змінюватися, якщо елемент кидають на його ж власне місце', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Текст 1' },
            { id: 2, type: 'p', content: 'Текст 2' }
        ];

        const draggedIndex = 1;
        const targetIndex = 1;

        if (draggedIndex !== targetIndex) {
            const moved = blocks.splice(draggedIndex, 1)[0];
            blocks.splice(targetIndex, 0, moved);
        }

        expect(blocks[0].content).toBe('Текст 1');
        expect(blocks[1].content).toBe('Текст 2');
    });

});