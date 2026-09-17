const APP_ID = import.meta.env.VITE_META_APP_ID;
const GRAPH_API_VERSION = 'v25.0';
const OAUTH_CALLBACK_ORIGIN_MESSAGE_TYPE = 'meta-oauth-callback';

function callbackUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}meta-callback`;
}

/**
 * Launches a real Meta OAuth dialog in a popup window (not the JS SDK's FB.login()) and
 * resolves with the authorization code and the redirect_uri used — the backend must exchange
 * the code with this exact same redirect_uri, and this exact URL must be registered under
 * "Valid OAuth Redirect URIs" in the App Dashboard (Facebook Login for Business > Settings).
 *
 * This deliberately avoids FB.login()/the JavaScript SDK: after extensive testing, codes
 * obtained via FB.login() for config_id-based Facebook Login for Business consistently failed
 * server-side exchange with a misleading "redirect_uri not identical" error regardless of what
 * redirect_uri was used (including values Meta's own Redirect URI Validator confirmed as valid).
 * A genuine browser-navigated OAuth redirect makes the redirect_uri binding unambiguous, since
 * it's the literal URL the browser lands on rather than something the SDK simulates internally.
 *
 * configId comes from the App Dashboard (WhatsApp > Configuration, or Facebook Login
 * for Business > Configurations) — see Settings for where to paste it once created.
 */
export async function launchMetaSignup(configId) {
  if (!configId) {
    throw new Error('This channel is not configured yet — add its Meta configuration ID first.');
  }
  if (!APP_ID) {
    throw new Error('VITE_META_APP_ID is not configured.');
  }

  const redirectUri = callbackUrl();
  const state = crypto.randomUUID();
  const authUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth` +
    `?client_id=${encodeURIComponent(APP_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&config_id=${encodeURIComponent(configId)}` +
    `&response_type=code` +
    `&override_default_response_type=true` +
    `&state=${encodeURIComponent(state)}`;

  const popup = window.open(authUrl, 'meta-oauth', 'width=600,height=720');
  if (!popup) {
    throw new Error('The sign-in popup was blocked — allow popups for this site and try again.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollClosed);
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== OAUTH_CALLBACK_ORIGIN_MESSAGE_TYPE) return;
      settled = true;
      cleanup();

      if (event.data.state !== state) {
        reject(new Error('Signup response failed a security check — please try again.'));
        return;
      }
      if (event.data.error) {
        reject(new Error(event.data.errorDescription || event.data.error));
        return;
      }
      if (!event.data.code) {
        reject(new Error('Signup was cancelled or did not complete.'));
        return;
      }
      resolve({ code: event.data.code, redirectUri });
    };

    window.addEventListener('message', handleMessage);

    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        if (!settled) {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Signup was cancelled or the window was closed.'));
        }
      }
    }, 500);
  });
}
