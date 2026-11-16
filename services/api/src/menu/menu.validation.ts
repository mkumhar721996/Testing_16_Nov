import { BadRequestException } from '@nestjs/common';
import type { ItemInput, VariantInput } from './menu.types';

type Errors = Record<string, string>;

function fail(errors: Errors): never {
  throw new BadRequestException(errors);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateCategoryName(name: unknown): string {
  const clean = cleanName(name);
  if (!clean) fail({ name: 'Category name is required' });
  return clean;
}

export function validateItemInput(input: unknown): ItemInput {
  if (typeof input !== 'object' || input === null) fail({ body: 'Item details are required' });
  const body = input as Record<string, unknown>;
  const errors: Errors = {};

  const name = cleanName(body.name);
  if (!name) errors.name = 'Item name is required';

  const rawVariants = body.variants ?? [];
  const variants: VariantInput[] = [];
  if (!Array.isArray(rawVariants)) {
    errors.variants = 'Variants must be a list';
  } else {
    rawVariants.forEach((raw: unknown, index) => {
      const variant = (raw ?? {}) as Record<string, unknown>;
      const variantName = cleanName(variant.name);
      if (!variantName) errors[`variants.${index}.name`] = 'Size name is required';
      if (!isPositiveInt(variant.priceMinor)) {
        errors[`variants.${index}.priceMinor`] = 'Size price must be more than 0';
      } else {
        variants.push({ name: variantName, priceMinor: variant.priceMinor });
      }
    });
  }

  if (!isPositiveInt(body.priceMinor)) {
    errors.priceMinor =
      body.priceMinor === undefined || body.priceMinor === null
        ? 'Price is required'
        : 'Price must be more than 0';
  }

  if (Object.keys(errors).length > 0) fail(errors);

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  return {
    name,
    description: description || null,
    priceMinor: body.priceMinor as number,
    variants,
  };
}
