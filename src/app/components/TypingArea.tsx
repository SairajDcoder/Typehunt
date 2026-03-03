import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { playKeystrokeSound } from '../services/sounds';

interface TypingAreaProps {
  words: string[];
  disabled?: boolean;
  onStart?: () => void;
  onProgress?: (data: {
    currentWordIndex: number;
    typedWords: string[];
    correctChars: number;
    totalChars: number;
    correctWords: number;
    keystrokeTimestamps: number[];
  }) => void;
  onFinish?: (data: {
    typedWords: string[];
    correctChars: number;
    totalChars: number;
    correctWords: number;
    keystrokeTimestamps: number[];
  }) => void;
  onMistake?: () => void; // For hardcore mode
  hardcoreMode?: boolean;
  accentColor?: string;
}

interface WordState {
  typed: string;
  isActive: boolean;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  words,
  disabled = false,
  onStart,
  onProgress,
  onFinish,
  onMistake,
  hardcoreMode = false,
  accentColor = '#9CD5FF',
}) => {
  const { soundEnabled, keyboardSound } = useSettings();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [wordHistory, setWordHistory] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [keystrokeTimestamps, setKeystrokeTimestamps] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Reset when words change
  useEffect(() => {
    setCurrentWordIndex(0);
    setCurrentInput('');
    setWordHistory([]);
    setStarted(false);
    setFinished(false);
    setKeystrokeTimestamps([]);
    hiddenInputRef.current?.focus();
  }, [words]);

  // Auto-scroll to keep active word visible
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeWord = activeWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = activeWord.getBoundingClientRect();

      // If the active word is below the visible area, scroll
      if (wordRect.top > containerRect.top + containerRect.height * 0.6) {
        container.scrollTop += wordRect.top - containerRect.top - containerRect.height * 0.3;
      }
    }
  }, [currentWordIndex]);

  // Focus hidden input on click
  const handleContainerClick = () => {
    if (!disabled && !finished) {
      hiddenInputRef.current?.focus();
    }
  };

  const getStats = useCallback(() => {
    let correctChars = 0;
    let totalChars = 0;
    let correctWords = 0;

    for (let i = 0; i < wordHistory.length; i++) {
      const typed = wordHistory[i];
      const target = words[i];
      totalChars += target.length;

      if (typed === target) {
        correctChars += target.length;
        correctWords++;
      } else {
        for (let j = 0; j < target.length; j++) {
          if (typed[j] === target[j]) correctChars++;
        }
      }
    }

    return { correctChars, totalChars, correctWords };
  }, [wordHistory, words]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || finished || words.length === 0) return;

    // Prevent default for Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }

    if (!started) {
      setStarted(true);
      onStart?.();
    }

    setKeystrokeTimestamps((prev) => [...prev, Date.now()]);

    // Play keystroke sound
    playKeystrokeSound(keyboardSound, soundEnabled);

    if (e.key === ' ') {
      e.preventDefault();
      if (currentInput.length === 0) return; // Don't allow empty words

      // Check hardcore mode — immediate fail on wrong word
      if (hardcoreMode && currentInput !== words[currentWordIndex]) {
        onMistake?.();
        return;
      }

      const newHistory = [...wordHistory, currentInput];
      setWordHistory(newHistory);

      const nextIndex = currentWordIndex + 1;

      if (nextIndex >= words.length) {
        // Finished!
        setFinished(true);
        setCurrentInput('');
        const { correctChars, totalChars, correctWords } = (() => {
          let cc = 0, tc = 0, cw = 0;
          for (let i = 0; i < newHistory.length; i++) {
            const typed = newHistory[i];
            const target = words[i];
            tc += target.length;
            if (typed === target) { cc += target.length; cw++; }
            else { for (let j = 0; j < target.length; j++) if (typed[j] === target[j]) cc++; }
          }
          return { correctChars: cc, totalChars: tc, correctWords: cw };
        })();

        onFinish?.({
          typedWords: newHistory,
          correctChars,
          totalChars,
          correctWords,
          keystrokeTimestamps,
        });
      } else {
        setCurrentWordIndex(nextIndex);
        setCurrentInput('');

        // Progress callback
        const { correctChars, totalChars, correctWords } = (() => {
          let cc = 0, tc = 0, cw = 0;
          for (let i = 0; i < newHistory.length; i++) {
            const typed = newHistory[i];
            const target = words[i];
            tc += target.length;
            if (typed === target) { cc += target.length; cw++; }
            else { for (let j = 0; j < target.length; j++) if (typed[j] === target[j]) cc++; }
          }
          return { correctChars: cc, totalChars: tc, correctWords: cw };
        })();

        onProgress?.({
          currentWordIndex: nextIndex,
          typedWords: newHistory,
          correctChars,
          totalChars,
          correctWords,
          keystrokeTimestamps,
        });
      }
    } else if (e.key === 'Backspace') {
      if (currentInput.length > 0) {
        setCurrentInput((prev) => prev.slice(0, -1));
      }
      // In hardcore mode, check if partial input still matches
      if (hardcoreMode) {
        const newInput = currentInput.slice(0, -1);
        // Allow backspace (partial re-check happens on next character)
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const newInput = currentInput + e.key;
      setCurrentInput(newInput);

      // Hardcore mode — check character-level correctness
      if (hardcoreMode) {
        const target = words[currentWordIndex];
        if (newInput.length <= target.length) {
          if (newInput[newInput.length - 1] !== target[newInput.length - 1]) {
            onMistake?.();
            return;
          }
        }
      }
    }
  };

  // Render a single word with character-level coloring
  const renderWord = (word: string, wordIndex: number) => {
    const isActive = wordIndex === currentWordIndex && !finished;
    const isCompleted = wordIndex < currentWordIndex;
    const isFuture = wordIndex > currentWordIndex;

    let typedForWord = '';
    if (isActive) {
      typedForWord = currentInput;
    } else if (isCompleted) {
      typedForWord = wordHistory[wordIndex] || '';
    }

    const chars: React.ReactNode[] = [];

    // Render each character of the target word
    for (let i = 0; i < word.length; i++) {
      let color: string;
      let className = '';

      if (isFuture || (!isActive && !isCompleted)) {
        // Untyped future word
        color = 'rgba(255, 255, 255, 0.35)';
      } else if (i < typedForWord.length) {
        // Character has been typed
        if (typedForWord[i] === word[i]) {
          color = 'rgba(255, 255, 255, 0.9)'; // Correct = bright white
        } else {
          color = '#e74c3c'; // Wrong = red
        }
      } else if (isCompleted) {
        // Word completed but this char wasn't typed (word was shorter)
        color = 'rgba(255, 255, 255, 0.35)';
      } else {
        // Upcoming char in current word
        color = 'rgba(255, 255, 255, 0.35)';
      }

      // Cursor: blinking left border on the current character
      const isCursorHere = isActive && i === typedForWord.length;

      chars.push(
        <span
          key={i}
          style={{ color, position: 'relative' }}
        >
          {isCursorHere && (
            <span
              className="typing-cursor"
              style={{
                position: 'absolute',
                left: '-1px',
                top: '2px',
                bottom: '2px',
                width: '2px',
                backgroundColor: accentColor,
                animation: 'cursorBlink 1s step-end infinite',
              }}
            />
          )}
          {word[i]}
        </span>
      );
    }

    // Extra typed characters beyond the word length (in red)
    if (typedForWord.length > word.length) {
      for (let i = word.length; i < typedForWord.length; i++) {
        chars.push(
          <span key={`extra-${i}`} style={{ color: '#e74c3c', textDecoration: 'line-through', opacity: 0.8 }}>
            {typedForWord[i]}
          </span>
        );
      }
    }

    // If this is the active word and cursor is at the end but within word length range
    // and we haven't added a cursor yet (e.g., cursor is after the last char)
    if (isActive && typedForWord.length === word.length) {
      // Cursor after the last character
      chars.push(
        <span key="cursor-end" style={{ position: 'relative' }}>
          <span
            className="typing-cursor"
            style={{
              position: 'absolute',
              left: '0px',
              top: '2px',
              bottom: '2px',
              width: '2px',
              backgroundColor: accentColor,
              animation: 'cursorBlink 1s step-end infinite',
            }}
          />
        </span>
      );
    }

    // If active word and cursor is at position 0 (no chars typed yet, cursor before first char)
    // We handled this in the loop above (i === 0 && typedForWord.length === 0)

    return (
      <span
        key={wordIndex}
        ref={isActive ? activeWordRef : undefined}
        className="inline-block mr-[10px] mb-[6px]"
        style={{
          borderBottom: isCompleted
            ? typedForWord === word
              ? 'none'
              : '2px solid #e74c3c'
            : 'none',
        }}
      >
        {chars}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative cursor-text"
        style={{
          maxHeight: '160px',
          overflow: 'hidden',
          lineHeight: '2.2',
          fontSize: '1.5rem',
          fontFamily: "'Roboto Mono', 'Fira Code', 'Courier New', monospace",
          outline: 'none',
          userSelect: 'none',
        }}
      >
        {/* Hidden input to capture keystrokes */}
        <input
          ref={hiddenInputRef}
          type="text"
          value=""
          onChange={() => {}} // Controlled by onKeyDown
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled || finished}
        />

        {/* Rendered words */}
        <div className="flex flex-wrap">
          {words.map((word, i) => renderWord(word, i))}
        </div>

        {/* Click-to-focus overlay when not focused */}
        {!disabled && !finished && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={handleContainerClick}
          >
            <span className="text-white/60 text-lg">Click here to type</span>
          </div>
        )}
      </div>
    </>
  );
};
