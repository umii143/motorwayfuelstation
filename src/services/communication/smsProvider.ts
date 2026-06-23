// Stub for SMS provider (mailto: or future API)
import { logger } from '../../lib/logger';
export class SmsProvider {
  static async send(to: string, message: string) {
    logger.info(`Sending SMS to ${to}: ${message}`);
    return true;
  }
}