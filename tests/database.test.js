const path = require('path');
const vm = require('vm');

describe('Database module', () => {
  let Database;
  let localStorageMock;

  const loadModule = () => {
    const code = require('fs').readFileSync(path.join(__dirname, '../js/database.js'), 'utf8');
    const context = { console, localStorage: localStorageMock, setTimeout, clearTimeout, clearInterval, setInterval, FileReader: function(){} };
    vm.createContext(context);
    vm.runInContext(code, context);
    return context.Database;
  };

  beforeEach(() => {
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: key => store[key],
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: key => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Database = loadModule();
  });

  test('addItem adds new items and prevents duplicates', () => {
    const item = { 'Catalog #': '123', Order: '', Family: '', Genus: '', Species: '', 'Common Name': '', Location: '', Country: '', 'How collected': '', 'Date collected': '' };
    expect(Database.addItem(item)).toBe(true);
    expect(Database.getItemByCatalog('123')).toEqual(item);
    expect(Database.addItem(item)).toBe(false);
  });

  test('getItemByCatalog trims catalog numbers', () => {
    const item = { 'Catalog #': 'abc', Order: '', Family: '', Genus: '', Species: '', 'Common Name': '', Location: '', Country: '', 'How collected': '', 'Date collected': '' };
    Database.addItem(item);
    expect(Database.getItemByCatalog(' abc ')).toEqual(item);
  });

  test('hasIncompleteFields identifies required fields', () => {
    const complete = { Order: 'A', Family: 'B', Genus: 'C', Species: 'D', 'Common Name': 'E', Location: 'F', Country: 'G', 'How collected': 'H', 'Date collected': 'I' };
    const incomplete = { Order: 'A', Family: '', Genus: 'C' };
    expect(Database.hasIncompleteFields(complete)).toBe(false);
    expect(Database.hasIncompleteFields(incomplete)).toBe(true);
  });
});
