/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Security
 * Standard: Audit Metadata (SHA-256 Web Crypto API)
 *
 * Enforces mandatory audit metadata on all operational and financial records.
 * Bitwise hash is DEPRECATED.
 */

export interface EnterpriseAuditFields {
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string;
  readonly createdBy: string; // User ID
  readonly updatedBy: string; // User ID
  readonly version: number;
  readonly auditHash: string; // SHA-256
  readonly source: 'WEB' | 'MOBILE' | 'API' | 'SYSTEM';
  readonly device: string;
  readonly ipAddress: string | null;
  readonly sessionId: string;
  readonly approvalStatus: string; // Refers to StatusRegistry
  readonly revisionNotes: string | null;
}

export class AuditMetadataManager {
  /**
   * Generates a SHA-256 hash using the native Web Crypto API.
   * This provides enterprise-grade tamper evidence.
   */
  static async generateHash(dataString: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `SHA256-${hashHex}`;
  }

  /**
   * Validates if a record's hash matches its current state.
   */
  static async verifyHash(recordDataString: string, existingHash: string): Promise<boolean> {
    const computedHash = await this.generateHash(recordDataString);
    return computedHash === existingHash;
  }
}
