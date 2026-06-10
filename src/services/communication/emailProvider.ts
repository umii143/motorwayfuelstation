// Stub for Email provider
export class EmailProvider {
  static async send(to: string, subject: string, body: string) {
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    return true;
  }
}