import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve data', () => {
    localStorage.setItem('test', 'hello');
    expect(localStorage.getItem('test')).toBe('hello');
  });

  it('should return null for non-existent keys', () => {
    expect(localStorage.getItem('nonexistent')).toBeNull();
  });

  it('should store JSON data', () => {
    const data = { id: 1, name: 'Test' };
    localStorage.setItem('json', JSON.stringify(data));
    const retrieved = JSON.parse(localStorage.getItem('json') || '{}');
    expect(retrieved).toEqual(data);
  });
});

describe('Storage Keys', () => {
  it('should have correct storage keys', () => {
    const STORAGE_KEYS = {
      PRODUCTS: 'tradelink_products',
      CLIENTS: 'tradelink_clients',
      INVOICES: 'tradelink_invoices',
      QUOTES: 'tradelink_quotes',
      ORDERS: 'tradelink_orders',
      DELIVERIES: 'tradelink_deliveries',
      PRICE_TIERS: 'tradelink_price_tiers',
    };

    expect(STORAGE_KEYS.PRODUCTS).toBe('tradelink_products');
    expect(STORAGE_KEYS.CLIENTS).toBe('tradelink_clients');
    expect(STORAGE_KEYS.INVOICES).toBe('tradelink_invoices');
  });
});
