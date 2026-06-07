/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from './firebase';

/**
 * Custom fetch wrapper that automatically appends active authorization tokens.
 * Supports both local-first (custom JWT) and SaaS mode (Firebase ID Token).
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // 1. Check if there's a custom backend JWT token (Local mode)
  const localToken = localStorage.getItem('fuelpro_auth_token');
  const isMockUser = localStorage.getItem('fuelpro_mock_user') === 'true';

  if (isMockUser) {
    headers.set('Authorization', `Bearer mock_token_owner`);
  } else if (localToken) {
    headers.set('Authorization', `Bearer ${localToken}`);
  } else {
    // 2. Fallback to Firebase ID Token (SaaS mode)
    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        const token = await fbUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      } catch (err) {
        console.error('[API] Error retrieving Firebase ID token:', err);
      }
    }
  }

  // Ensure JSON requests set Content-Type header if body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers
  });
}
