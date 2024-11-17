// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window properties
Object.defineProperty(window, 'devicePixelRatio', {
    value: 1
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
