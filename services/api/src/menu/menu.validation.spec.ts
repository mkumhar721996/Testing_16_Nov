import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateCategoryName, validateItemInput } from './menu.validation';

describe('validateItemInput', () => {
  it('accepts an item with a name and a price', () => {
    expect(validateItemInput({ name: ' Soup ', priceMinor: 450 })).toEqual({
      name: 'Soup',
      description: null,
      priceMinor: 450,
      variants: [],
    });
  });

  it('refuses an item with size variants and no own price (AC 13)', () => {
    expect(() =>
      validateItemInput({ name: 'Pizza', variants: [{ name: 'Large', priceMinor: 1400 }] }),
    ).toThrow(BadRequestException);
  });

  it('refuses an empty name (AC 14)', () => {
    for (const name of ['', '   ', undefined]) {
      expect(() => validateItemInput({ name, priceMinor: 450, variants: [] })).toThrow(
        BadRequestException,
      );
    }
  });

  it('refuses a price of zero or less (AC 15)', () => {
    for (const priceMinor of [0, -100, 1.5, '4']) {
      expect(() => validateItemInput({ name: 'Soup', priceMinor, variants: [] })).toThrow(
        BadRequestException,
      );
    }
  });

  it('refuses a variant with a zero price or no name', () => {
    expect(() =>
      validateItemInput({ name: 'Soup', priceMinor: 450, variants: [{ name: 'L', priceMinor: 0 }] }),
    ).toThrow(BadRequestException);
    expect(() =>
      validateItemInput({ name: 'Soup', priceMinor: 450, variants: [{ name: ' ', priceMinor: 5 }] }),
    ).toThrow(BadRequestException);
  });

  it('refuses a non-object body', () => {
    expect(() => validateItemInput(null)).toThrow(BadRequestException);
  });
});

describe('validateCategoryName', () => {
  it('trims and refuses empty', () => {
    expect(validateCategoryName(' Starters ')).toBe('Starters');
    expect(() => validateCategoryName('  ')).toThrow(BadRequestException);
    expect(() => validateCategoryName(undefined)).toThrow(BadRequestException);
  });
});
