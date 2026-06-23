// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { WhatsAppProvider, WhatsAppPayload } from './whatsappProvider';
import { SmsProvider } from './smsProvider';
import { EmailProvider } from './emailProvider';
import { CloudApiProvider } from './cloudApiProvider';

export type CommunicationChannel = 'whatsapp' | 'sms' | 'email' | 'cloud';

export interface CommunicationPayload {
  to: string;
  message: string;
  subject?: string;
  isBusiness?: boolean;
}

export class CommunicationManager {
  static async sendMessage(channel: CommunicationChannel, payload: CommunicationPayload): Promise<boolean> {
    try {
      switch (channel) {
        case 'whatsapp':
          return await WhatsAppProvider.send({
            to: payload.to,
            message: payload.message,
            isBusiness: payload.isBusiness
          });
        case 'sms':
          return await SmsProvider.send(payload.to, payload.message);
        case 'email':
          if (!payload.subject) throw new Error('Email requires a subject');
          return await EmailProvider.send(payload.to, payload.subject, payload.message);
        case 'cloud':
          return await CloudApiProvider.send(payload);
        default:
          throw new Error('Unsupported communication channel');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to send message via ${channel}:`, err);
      return false;
    }
  }

  static async sendBulk(channel: CommunicationChannel, payloads: CommunicationPayload[]): Promise<number> {
    let successCount = 0;
    
    // MVP implementation: Since we're using local URI schemes, we cannot truly "bulk send" automatically.
    // We will loop, but window.open will require user confirmation for each popup.
    for (const payload of payloads) {
      const success = await this.sendMessage(channel, payload);
      if (success) successCount++;
    }
    
    return successCount;
  }
}
