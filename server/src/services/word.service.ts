import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { shuffleArray } from '../utils/helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load word list
let wordList: string[] = [];

try {
  const wordsPath = join(__dirname, '../../words/english.json');
  const data = readFileSync(wordsPath, 'utf-8');
  wordList = JSON.parse(data);
} catch {
  // Fallback word list
  wordList = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
    'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'find', 'here', 'thing', 'many', 'right', 'being',
    'long', 'great', 'another', 'still', 'through', 'should', 'between', 'never',
    'world', 'life', 'hand', 'high', 'keep', 'every', 'last', 'point', 'kind',
    'need', 'house', 'large', 'since', 'place', 'while', 'under', 'same',
    'school', 'might', 'each', 'number', 'open', 'begin', 'seem', 'help',
    'change', 'family', 'country', 'state', 'move', 'system', 'computer',
    'program', 'question', 'problem', 'important', 'group', 'company', 'develop',
    'social', 'government', 'example', 'during', 'always', 'around', 'water',
    'enough', 'almost', 'service', 'story', 'power', 'follow', 'learn', 'city',
    'without', 'study', 'student', 'head', 'against', 'start', 'believe',
    'idea', 'body', 'information', 'nothing', 'leave', 'stand', 'real', 'happen',
    'interest', 'already', 'result', 'small', 'reason', 'business', 'provide',
    'young', 'possible', 'consider', 'often', 'process', 'return', 'morning',
    'different', 'together', 'include', 'level', 'rather', 'suggest', 'continue',
    'member', 'money', 'health', 'certain', 'community', 'activity', 'report',
    'education', 'general', 'remember', 'question', 'office', 'current', 'growth',
    'better', 'manage', 'decision', 'future', 'special', 'difficult', 'control',
    'create', 'simple', 'building', 'market', 'paper', 'natural', 'standard',
    'language', 'industry', 'focus', 'pressure', 'material', 'complete', 'figure',
    'expect', 'teacher', 'quality', 'practice', 'position', 'support', 'produce',
    'research', 'picture', 'project', 'surface', 'structure', 'establish',
    'experience', 'technology', 'performance', 'opportunity', 'organization',
    'individual', 'particular', 'significant', 'development', 'environment',
    'relationship', 'understand', 'available', 'traditional', 'international',
    'professional', 'identify', 'management', 'economy', 'necessary', 'various',
    'physical', 'population', 'strategy', 'authority', 'financial', 'knowledge',
  ];
}

const PUNCTUATION_MARKS = ['.', ',', '!', '?', ';', ':'];
const NUMBER_WORDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '15', '20', '25', '42', '50', '75', '100', '128', '256', '512', '1024'];

export interface WordGenOptions {
  count: number;
  punctuation: boolean;
  numbers: boolean;
  capitalization: boolean;
}

export class WordService {
  generateWords(options: WordGenOptions): string[] {
    const { count, punctuation, numbers, capitalization } = options;
    const clampedCount = Math.min(Math.max(count, 5), 200);

    // Pick random words
    const shuffled = shuffleArray(wordList);
    let words: string[] = [];

    // Fill words from the shuffled list (may repeat if count > list length)
    while (words.length < clampedCount) {
      const remaining = clampedCount - words.length;
      words = words.concat(shuffled.slice(0, remaining));
      if (words.length < clampedCount) {
        // Re-shuffle for variety
        words = words.concat(shuffleArray(wordList).slice(0, remaining));
      }
    }

    words = words.slice(0, clampedCount);

    // Apply modifiers
    if (numbers) {
      // Replace ~10% of words with numbers
      const numCount = Math.max(1, Math.floor(clampedCount * 0.1));
      for (let i = 0; i < numCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        words[idx] = NUMBER_WORDS[Math.floor(Math.random() * NUMBER_WORDS.length)];
      }
    }

    if (capitalization) {
      // Capitalize ~20% of words
      const capCount = Math.max(1, Math.floor(clampedCount * 0.2));
      for (let i = 0; i < capCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        words[idx] = words[idx].charAt(0).toUpperCase() + words[idx].slice(1);
      }
    }

    if (punctuation) {
      // Add punctuation to ~15% of words
      const punctCount = Math.max(1, Math.floor(clampedCount * 0.15));
      for (let i = 0; i < punctCount; i++) {
        const idx = Math.floor(Math.random() * clampedCount);
        const mark = PUNCTUATION_MARKS[Math.floor(Math.random() * PUNCTUATION_MARKS.length)];
        words[idx] = words[idx] + mark;
      }
    }

    return words;
  }
}

export const wordService = new WordService();
