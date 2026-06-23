// Stub for SMS provider (mailto: or future API)
export class SmsProvider {
  static async send(to: string, message: string) {
    // eslint-disable-next-line no-console
    console.log(`Sending SMS to ${to}: ${message}`);
    return true;
  }
}