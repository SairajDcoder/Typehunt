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
  onMistake?: () => void;
  onRestart?: () => void;
  hardcoreMode?: boolean;
  accentColor?: string;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  words,
  disabled = false,
  onStart,
  onProgress,
  onFinish,
  onMistake,
  onRestart,
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
  const [isFocused, setIsFocused] = useState(false);
  const [tabPressed, setTabPressed] = useState(false);

  // Smooth caret state
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Reset when words change
  useEffect(() => {
    setCurrentWordIndex(0);
    setCurrentInput('');
    setWordHistory([]);
    setStarted(false);
    setFinished(false);
    setKeystrokeTimestamps([]);
    setTabPressed(false);
    charRefs.current.clear();
    setTimeout(() => {
      hiddenInputRef.current?.focus();
      updateCaretPosition(0, '');
    }, 50);
  }, [words]);

  // Update caret position smoothly
  const updateCaretPosition = useCallback((wordIdx: number, input: string) => {
    if (!wordsContainerRef.current) return;

    const charIdx = input.length;
    const word = words[wordIdx] || '';

    // Find the right character element to position the caret next to
    let targetKey: string;
    if (charIdx < word.length) {
      targetKey = `char-${wordIdx}-${charIdx}`;
    } else if (charIdx >= word.length && charIdx > 0) {
      // Caret is after the last char or after extra chars
      targetKey = `char-${wordIdx}-${charIdx - 1}`;
    } else {
      targetKey = `char-${wordIdx}-0`;
    }

    const charEl = charRefs.current.get(targetKey);
    const container = wordsContainerRef.current;

    if (charEl && container) {
      const containerRect = container.getBoundingClientRect();
      const charRect = charEl.getBoundingClientRect();

      let left: number;
      if (charIdx < word.length) {
        // Before the character
        left = charRect.left - containerRect.left;
      } else {
        // After the character
        left = charRect.right - containerRect.left;
      }

      setCaretPos({
        left,
        top: charRect.top - containerRect.top,
        height: charRect.height,
      });
    }
  }, [words]);

  // Update caret whenever typing state changes
  useEffect(() => {
    requestAnimationFrame(() => {
      updateCaretPosition(currentWordIndex, currentInput);
    });
  }, [currentWordIndex, currentInput, updateCaretPosition]);

  // Auto-scroll to keep active word visible
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeWord = activeWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = activeWord.getBoundingClientRect();

      if (wordRect.top > containerRect.top + containerRect.height * 0.6) {
        container.scrollTop += wordRect.top - containerRect.top - containerRect.height * 0.3;
      }
    }
  }, [currentWordIndex]);

  const handleContainerClick = () => {
    if (!disabled && !finished) {
      hiddenInputRef.current?.focus();
    }
  };

  const computeStats = (history: string[]) => {
    let cc = 0, tc = 0, cw = 0;
    for (let i = 0; i < history.length; i++) {
      const typed = history[i];
      const target = words[i];
      tc += target.length;
      if (typed === target) { cc += target.length; cw++; }
      else { for (let j = 0; j < target.length; j++) if (typed[j] === target[j]) cc++; }
    }
    return { correctChars: cc, totalChars: tc, correctWords: cw };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || finished || words.length === 0) return;

    // Tab+Enter restart
    if (e.key === 'Tab') {
      e.preventDefault();
      setTabPressed(true);
      setTimeout(() => setTabPressed(false), 500);
      return;
    }

    if (e.key === 'Enter' && tabPressed) {
      e.preventDefault();
      setTabPressed(false);
      onRestart?.();
      return;
    }

    if (!started) {
      setStarted(true);
      onStart?.();
    }

    setKeystrokeTimestamps((prev) => [...prev, Date.now()]);
    playKeystrokeSound(keyboardSound, soundEnabled);

    if (e.key === ' ') {
      e.preventDefault();
      if (currentInput.length === 0) return;

      if (hardcoreMode && currentInput !== words[currentWordIndex]) {
        onMistake?.();
        return;
      }

      const newHistory = [...wordHistory, currentInput];
      setWordHistory(newHistory);
      const nextIndex = currentWordIndex + 1;

      if (nextIndex >= words.length) {
        setFinished(true);
        setCurrentInput('');
        const stats = computeStats(newHistory);
        onFinish?.({ typedWords: newHistory, ...stats, keystrokeTimestamps });
      } else {
        setCurrentWordIndex(nextIndex);
        setCurrentInput('');
        const stats = computeStats(newHistory);
        onProgress?.({ currentWordIndex: nextIndex, typedWords: newHistory, ...stats, keystrokeTimestamps });
      }
    } else if (e.key === 'Backspace') {
      if (currentInput.length > 0) {
        setCurrentInput((prev) => prev.slice(0, -1));
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const newInput = currentInput + e.key;
      setCurrentInput(newInput);

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

  // Register a char ref
  const setCharRef = useCallback((key: string, el: HTMLSpanElement | null) => {
    if (el) {
      charRefs.current.set(key, el);
    }
  }, []);

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

    for (let i = 0; i < word.length; i++) {
      let color: string;

      if (isFuture || (!isActive && !isCompleted)) {
        color = 'rgba(255, 255, 255, 0.35)';
      } else if (i < typedForWord.length) {
        color = typedForWord[i] === word[i] ? 'rgba(255, 255, 255, 0.9)' : '#e74c3c';
      } else {
        color = 'rgba(255, 255, 255, 0.35)';
      }

      const charKey = `char-${wordIndex}-${i}`;
      chars.push(
        <span
          key={charKey}
          ref={(el) => setCharRef(charKey, el)}
          style={{ color }}
        >
          {word[i]}
        </span>
      );
    }

    // Extra typed characters beyond word length
    if (typedForWord.length > word.length) {
      for (let i = word.length; i < typedForWord.length; i++) {
        const extraKey = `char-${wordIndex}-${i}`;
        chars.push(
          <span
            key={extraKey}
            ref={(el) => setCharRef(extraKey, el)}
            style={{ color: '#e74c3c', opacity: 0.7, fontSize: '0.85em' }}
          >
            {typedForWord[i]}
          </span>
        );
      }
    }

    return (
      <span
        key={wordIndex}
        ref={isActive ? activeWordRef : undefined}
        className="inline-block"
        style={{
          marginRight: '12px',
          marginBottom: '4px',
          paddingBottom: '2px',
          borderBottom: isCompleted
            ? typedForWord === word
              ? 'none'
              : '2px solid rgba(231, 76, 60, 0.6)'
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
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative cursor-text"
        style={{
          maxHeight: '180px',
          overflow: 'hidden',
          outline: 'none',
          userSelect: 'none',
        }}
      >
        {/* Hidden input */}
        <input
          ref={hiddenInputRef}
          type="text"
          value=""
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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

        {/* Words container (caret positions relative to this) */}
        <div
          ref={wordsContainerRef}
          className="relative flex flex-wrap"
          style={{
            lineHeight: '2.4',
            fontSize: '1.4rem',
            fontFamily: "'Roboto Mono', 'Fira Code', 'Courier New', monospace",
            letterSpacing: '0.02em',
          }}
        >
          {/* Smooth animated caret */}
          {!disabled && !finished && isFocused && (
            <div
              style={{
                position: 'absolute',
                left: `${caretPos.left}px`,
                top: `${caretPos.top}px`,
                width: '2.5px',
                height: `${caretPos.height || 28}px`,
                backgroundColor: accentColor,
                borderRadius: '2px',
                transition: 'left 80ms ease-out, top 80ms ease-out',
                animation: started ? 'none' : 'caretBlink 1s step-end infinite',
                zIndex: 10,
                pointerEvents: 'none',
                boxShadow: `0 0 8px ${accentColor}60`,
              }}
            />
          )}

          {words.map((word, i) => renderWord(word, i))}
        </div>

        {/* Blur overlay — show when not focused */}
        {!disabled && !finished && !isFocused && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm transition-opacity"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={handleContainerClick}
          >
            <span className="text-white/70 text-lg font-medium tracking-wide">Click here or press any key to focus</span>
          </div>
        )}

        {/* Tab+Enter hint */}
        {started && !finished && (
          <div className="absolute bottom-0 right-0 text-white/20 text-xs px-2 py-1">
            Tab + Enter to restart
          </div>
        )}
      </div>
    </>
  );
};
