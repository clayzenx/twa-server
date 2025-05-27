import { validate, isSignatureInvalidError } from '@telegram-apps/init-data-node'

const BOT_TOKEN = process.env.BOT_TOKEN || ''
const TAG = '[verifyInitData]'

export function verifyInitData(initDataString: string): boolean {
  try {
    validate(initDataString, BOT_TOKEN);
  } catch (e) {
    if (isSignatureInvalidError(e)) {
      console.error(`${TAG}: Sign is invalid`);
      console.error(e);
    }
    return false;
  }
  return true;
}

