export function calculateWPM(
  correctChars: number,
  timeInSeconds: number
): number {
  if (timeInSeconds <= 0) return 0;
  // Standard WPM: (characters / 5) / minutes
  const minutes = timeInSeconds / 60;
  return Math.round((correctChars / 5) / minutes * 100) / 100;
}

export function calculateAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  if (totalKeystrokes <= 0) return 0;
  return Math.round((correctKeystrokes / totalKeystrokes) * 10000) / 100;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
