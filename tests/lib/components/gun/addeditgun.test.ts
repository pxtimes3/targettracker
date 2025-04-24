// src/lib/components/gun/addEditGun.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock caliber utilities before importing the module under test
vi.mock('@/utils/caliber', () => ({
  validateCaliberInput: vi.fn(),
  convertCaliberToMm: vi.fn()
}));

import { 
    formatGunType, 
    createGunTypeOptions,
    handleCaliberInput, 
    onCaliberSelected,
    handleSubmit 
} from '/src/lib/components/gun/addeditgun.ts';

// Import the mocked functions to control their behavior in tests
import { validateCaliberInput, convertCaliberToMm } from '@/utils/caliber';

// Mock Svelte store
vi.mock('svelte/store', () => ({
  derived: vi.fn(() => ({ subscribe: vi.fn() }))
}));

describe('Gun Form Logic', () => {
  describe('formatGunType', () => {
    it('should format gun types correctly', () => {
      expect(formatGunType('rifle')).toBe('Rifle');
      expect(formatGunType('air-rifle')).toBe('Air Rifle');
    });
  });
  
  describe('createGunTypeOptions', () => {
    it('should create options from gunTypes array', () => {
      const gunTypes = ['rifle', 'air-rifle'];
      const options = createGunTypeOptions(gunTypes);
      
      expect(options).toHaveLength(2);
      expect(options[0].value).toBe('rifle');
      expect(options[0].label).toBe('Rifle');
      expect(options[1].value).toBe('air-rifle');
      expect(options[1].label).toBe('Air Rifle');
    });
  });
  
  describe('onCaliberSelected', () => {
    it('should call setter with selected caliber', () => {
      const setSelectedCaliber = vi.fn();
      onCaliberSelected('22lr', setSelectedCaliber);
      expect(setSelectedCaliber).toHaveBeenCalledWith('22lr');
    });
  });
  
  describe('handleCaliberInput', () => {
    beforeEach(() => {
      // Reset mocks
      vi.resetAllMocks();
      
      // Mock document.getElementById
      document.getElementById = vi.fn().mockReturnValue({
        value: ''
      });
    });
    
    it('should update caliberMm when input is valid', () => {
      // Setup mocks for this test
      (validateCaliberInput as any).mockReturnValue(true);
      (convertCaliberToMm as any).mockReturnValue(5.56);
      
      // Mock DOM elements
      const mockInput = {
        value: '5.56',
        classList: {
          remove: vi.fn(),
          add: vi.fn()
        }
      };
      
      const setCaliberMm = vi.fn();
      
      // Call the function
      handleCaliberInput({ target: mockInput } as unknown as Event, setCaliberMm);
      
      // Assertions
      expect(validateCaliberInput).toHaveBeenCalledWith('5.56');
      expect(convertCaliberToMm).toHaveBeenCalledWith('5.56');
      expect(setCaliberMm).toHaveBeenCalledWith(5.56);
      expect(mockInput.classList.remove).toHaveBeenCalledWith('invalid');
      expect(mockInput.classList.add).toHaveBeenCalledWith('valid');
    });
    
    it('should mark input as invalid when input is invalid', () => {
      // Setup mocks for this test
      (validateCaliberInput as any).mockReturnValue(false);
      
      // Mock DOM elements
      const mockInput = {
        value: 'invalid',
        classList: {
          remove: vi.fn(),
          add: vi.fn()
        }
      };
      
      const setCaliberMm = vi.fn();
      
      // Call the function
      handleCaliberInput({ target: mockInput } as unknown as Event, setCaliberMm);
      
      // Assertions
      expect(validateCaliberInput).toHaveBeenCalledWith('invalid');
      expect(convertCaliberToMm).not.toHaveBeenCalled();
      expect(setCaliberMm).not.toHaveBeenCalled();
      expect(mockInput.classList.remove).toHaveBeenCalledWith('valid');
      expect(mockInput.classList.add).toHaveBeenCalledWith('invalid');
    });
  });
  
  describe('handleSubmit', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      global.fetch = vi.fn();
      global.console.log = vi.fn();
      global.console.error = vi.fn();
      
      // Mock FormData
      global.FormData = vi.fn().mockImplementation(() => ({
        entries: () => [],
        get: () => undefined
      }));
      
      // Mock Object.fromEntries
      global.Object.fromEntries = vi.fn().mockReturnValue({});
    });
    
    it('should handle successful submission', async () => {
      const mockEvent: { 
        preventDefault: () => void; 
        target: { [key: string]: { value: string } } 
      } = {
        preventDefault: vi.fn(),
        target: {
          name: { value: 'Test Gun' },
          type: { value: 'rifle' }
        }
      };
      
      global.FormData = vi.fn().mockImplementation(() => ({
        entries: () => [['name', 'Test Gun'], ['type', 'rifle']],
        get: (key: string) => mockEvent.target[key]?.value
      }));
      
      global.Object.fromEntries = vi.fn().mockReturnValue({
        name: 'Test Gun',
        type: 'rifle'
      });
      
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      });
      
      const result = await handleSubmit(
        mockEvent as unknown as Event,
        { id: '123', userId: '456' },
        'csrf-token'
      );
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/gun/', expect.any(Object));
    });
    
    it('should handle submission errors', async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        target: {}
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Test error' })
      });
      
      const result = await handleSubmit(
        mockEvent as unknown as Event,
        { id: '123', userId: '456' },
        'csrf-token'
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Test error');
    });
  });
});
