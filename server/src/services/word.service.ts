import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { shuffleArray } from '../utils/helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type Category = 'common' | 'advanced' | 'programming' | 'quotes';

// Load all word lists
const wordLists: Record<Category, string[]> = {
  common: [],
  advanced: [],
  programming: [],
  quotes: [],
};

function loadWordList(filename: string, fallback: string[]): string[] {
  try {
    const filePath = join(__dirname, '../../words', filename);
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// Common / English words
wordLists.common = loadWordList('english.json', [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
  'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
]);

// Advanced vocabulary
wordLists.advanced = loadWordList('advanced.json', [
  'ephemeral', 'ubiquitous', 'paradigm', 'juxtapose', 'pragmatic', 'eloquent',
  'meticulous', 'resilient', 'inquisitive', 'audacious', 'benevolent', 'capricious',
]);

// Programming terms
wordLists.programming = loadWordList('programming.json', [
  'function', 'variable', 'constant', 'array', 'object', 'string', 'number',
  'boolean', 'class', 'interface', 'method', 'property', 'constructor', 'prototype',
]);

// Quotes — stored as full sentences, split into words at generation time
const quotesRaw: string[] = loadWordList('quotes.json', [
  'the only way to do great work is to love what you do',
  'talk is cheap show me the code',
]);

// Flatten quotes into individual words
wordLists.quotes = quotesRaw.flatMap((q: any) => typeof q === 'string' ? q.split(/\s+/) : [q]);

const PUNCTUATION_MARKS = ['.', ',', '!', '?', ';', ':'];
const NUMBER_WORDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '15', '20', '25', '42', '50', '75', '100', '128', '256', '512', '1024'];

export interface WordGenOptions {
  count: number;
  punctuation: boolean;
  numbers: boolean;
  capitalization: boolean;
  category?: Category;
}

export class WordService {
  generateWords(options: WordGenOptions): string[] {
    const { count, punctuation, numbers, capitalization, category = 'common' } = options;
    const clampedCount = Math.min(Math.max(count, 5), 200);

    // Pick the right word list
    const sourceWords = wordLists[category] || wordLists.common;

    // For quotes category, return sequential words (not shuffled) to preserve quote structure
    if (category === 'quotes') {
      return this.generateQuoteWords(clampedCount);
    }

    // Pick random words
    const shuffled = shuffleArray(sourceWords);
    let words: string[] = [];

    while (words.length < clampedCount) {
      const remaining = clampedCount - words.length;
      words = words.concat(shuffled.slice(0, remaining));
      if (words.length < clampedCount) {
        words = words.concat(shuffleArray(sourceWords).slice(0, remaining));
      }
    }

    words = words.slice(0, clampedCount);

    // Apply modifiers
    if (numbers) {
      const numCount = Math.max(1, Math.floor(clampedCount * 0.1));
      for (let i = 0; i < numCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        words[idx] = NUMBER_WORDS[Math.floor(Math.random() * NUMBER_WORDS.length)];
      }
    }

    if (capitalization) {
      const capCount = Math.max(1, Math.floor(clampedCount * 0.2));
      for (let i = 0; i < capCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        words[idx] = words[idx].charAt(0).toUpperCase() + words[idx].slice(1);
      }
    }

    if (punctuation) {
      const punctCount = Math.max(1, Math.floor(clampedCount * 0.15));
      for (let i = 0; i < punctCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        const mark = PUNCTUATION_MARKS[Math.floor(Math.random() * PUNCTUATION_MARKS.length)];
        words[idx] = words[idx] + mark;
      }
    }

    return words;
  }

  private generateQuoteWords(count: number): string[] {
    // Pick random quotes sequentially until we have enough words
    const shuffledQuotes = shuffleArray(quotesRaw);
    const words: string[] = [];

    for (const quote of shuffledQuotes) {
      if (words.length >= count) break;
      const quoteWords = typeof quote === 'string' ? quote.split(/\s+/) : [];
      words.push(...quoteWords);
    }

    // If still not enough, cycle through
    while (words.length < count) {
      const q = quotesRaw[Math.floor(Math.random() * quotesRaw.length)];
      const qWords = typeof q === 'string' ? q.split(/\s+/) : [];
      words.push(...qWords);
    }

    return words.slice(0, count);
  }
}

export const wordService = new WordService();
