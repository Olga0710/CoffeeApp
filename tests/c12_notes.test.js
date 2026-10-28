
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

describe('C12: Markdown Editor (Dynamic UI & LocalStorage Logic)', () => {

    const STORAGE_KEY = 'zruchno_notion_doc_v1';

    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('1. Початковий стан: масив блоків створюється з дефолтними даними, якщо сховище порожнє', () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const blocks = savedData ? JSON.parse(savedData) : [
            { id: 1, type: 'h1', content: 'Ласкаво просимо!' },
            { id: 2, type: 'p', content: 'Тестовий параграф' }
        ];

        expect(blocks).toBeDefined();
        expect(blocks.length).toBe(2);
        expect(blocks[0].type).toBe('h1');
        expect(blocks[1].type).toBe('p');
    });

    test('2. Збереження та відновлення даних (Persistence via localStorage)', () => {
        const testBlocks = [
            { id: 101, type: 'h1', content: 'Заголовок нотатки' },
            { id: 102, type: 'ul', content: 'Еспресо' },
            { id: 103, type: 'ul', content: 'Капучино' }
        ];

       
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testBlocks));

     
        const loadedBlocks = JSON.parse(localStorage.getItem(STORAGE_KEY));

        expect(loadedBlocks).toEqual(testBlocks);
        expect(loadedBlocks.length).toBe(3);
        expect(loadedBlocks[1].content).toBe('Еспресо');
    });

    test('3. Додавання нового блоку (addBlock)', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Перший рядок' }
        ];

        function addBlock(blocksArray, activeIndex, type) {
            const insertIndex = activeIndex + 1;
            const newBlock = { id: Date.now(), type: type, content: '' };
            blocksArray.splice(insertIndex, 0, newBlock);
            return { blocksArray, newIndex: insertIndex };
        }

        const result = addBlock(blocks, 0, 'h2');

        expect(result.blocksArray.length).toBe(2);
        expect(result.blocksArray[1].type).toBe('h2');
        expect(result.blocksArray[1].content).toBe('');
        expect(result.newIndex).toBe(1);
    });

    test('4. Видалення блоку за індексом (Delete block)', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Рядок 1' },
            { id: 2, type: 'p', content: 'Рядок 2 для видалення' }
        ];

        function deleteBlock(blocksArray, index) {
            if (blocksArray.length > 1) {
                blocksArray.splice(index, 1);
            }
            return blocksArray;
        }

        const updatedBlocks = deleteBlock(blocks, 1);

        expect(updatedBlocks.length).toBe(1);
        expect(updatedBlocks[0].content).toBe('Рядок 1');
    });

    test('5. Захист від видалення останнього єдиного блоку', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Останній рядок' }
        ];

        function deleteBlock(blocksArray, index) {
            if (blocksArray.length > 1) {
                blocksArray.splice(index, 1);
            }
            return blocksArray;
        }

        const updatedBlocks = deleteBlock(blocks, 0);

       
        expect(updatedBlocks.length).toBe(1);
        expect(updatedBlocks[0].content).toBe('Останній рядок');
    });

    test('6. Очищення всього документа (clearAll / Reset)', () => {
        let blocks = [
            { id: 1, type: 'h1', content: 'Багато' },
            { id: 2, type: 'p', content: 'Різного' },
            { id: 3, type: 'ul', content: 'Тексту' }
        ];

        function clearAllBlocks() {
            return [{ id: Date.now(), type: 'p', content: '' }];
        }

        blocks = clearAllBlocks();

        expect(blocks.length).toBe(1);
        expect(blocks[0].type).toBe('p');
        expect(blocks[0].content).toBe('');
    });

    test('7. Оновлення контенту блоку при вводі (Input simulation)', () => {
        let blocks = [
            { id: 1, type: 'p', content: 'Старий текст' }
        ];

        function updateBlockContent(blocksArray, index, newText) {
            blocksArray[index].content = newText;
            return blocksArray;
        }

        const updated = updateBlockContent(blocks, 0, 'Новий текст нотатки баристи');

        expect(updated[0].content).toBe('Новий текст нотатки баристи');
    });
});