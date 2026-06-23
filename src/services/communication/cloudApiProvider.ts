// Placeholder for future Twilio / WA Cloud APIs
import { logger } from '../../lib/logger';
export class CloudApiProvider {
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async send(payload: unknown) {
    logger.info('Cloud API not enabled for MVP');
    return false;
  }
}