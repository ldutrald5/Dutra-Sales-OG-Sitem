(function attachCnpjDomain(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_CNPJ = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCnpjDomain() {
  'use strict';

  const BASE_LENGTH = 12;
  const TOTAL_LENGTH = 14;
  const FIRST_DV_WEIGHTS = Object.freeze([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const SECOND_DV_WEIGHTS = Object.freeze([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  function clean(value) {
    return String(value ?? '').trim().toUpperCase();
  }

  function normalize(value) {
    return clean(value).replace(/[.\/\-\s]/g, '');
  }

  function isBaseShape(value) {
    return /^[A-Z0-9]{12}$/.test(normalize(value));
  }

  function isShape(value) {
    return /^[A-Z0-9]{12}\d{2}$/.test(normalize(value));
  }

  function charValue(char) {
    return char.charCodeAt(0) - 48;
  }

  function digitFor(values, weights) {
    const sum = values.reduce((total, value, index) => total + value * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  function calculateCheckDigits(value) {
    const base = normalize(value);
    if (base.length !== BASE_LENGTH || !/^[A-Z0-9]{12}$/.test(base)) {
      throw new Error('Base de CNPJ deve conter 12 caracteres alfanuméricos válidos.');
    }
    const values = [...base].map(charValue);
    const first = digitFor(values, FIRST_DV_WEIGHTS);
    const second = digitFor([...values, first], SECOND_DV_WEIGHTS);
    return `${first}${second}`;
  }

  function isValid(value) {
    const normalized = normalize(value);
    if (!isShape(normalized)) return false;
    if (/^(\d)\1{13}$/.test(normalized)) return false;
    return normalized.slice(-2) === calculateCheckDigits(normalized.slice(0, BASE_LENGTH));
  }

  function format(value) {
    const normalized = normalize(value);
    if (!isShape(normalized)) return normalized;
    return normalized.replace(/^(.{2})(.{3})(.{3})(.{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  function root(value) {
    const normalized = normalize(value);
    return isShape(normalized) ? normalized.slice(0, 8) : '';
  }

  function order(value) {
    const normalized = normalize(value);
    return isShape(normalized) ? normalized.slice(8, 12) : '';
  }

  return Object.freeze({
    BASE_LENGTH,
    TOTAL_LENGTH,
    FIRST_DV_WEIGHTS,
    SECOND_DV_WEIGHTS,
    normalize,
    isBaseShape,
    isShape,
    calculateCheckDigits,
    isValid,
    format,
    root,
    order
  });
}));
