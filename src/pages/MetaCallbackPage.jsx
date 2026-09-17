import { useEffect } from 'react';

/**
 * Landing page for Meta's OAuth redirect (see facebookSdk.js). Opened in a popup window,
 * relays the code/state/error back to the window that opened it via postMessage, then closes.
 */
export function MetaCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = {
      type: 'meta-oauth-callback',
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      errorDescription: params.get('error_description') || params.get('error_message')
    };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>Completing sign-in…</p>
    </div>
  );
}
