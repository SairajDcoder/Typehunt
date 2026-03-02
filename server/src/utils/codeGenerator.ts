import crypto from 'crypto';

const LOBBY_CODE_LENGTH = 6;
const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion

export function generateLobbyCode(): string {
  let code = '';
  for (let i = 0; i < LOBBY_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, LOBBY_CODE_CHARS.length);
    code += LOBBY_CODE_CHARS[randomIndex];
  }
  return code;
}
