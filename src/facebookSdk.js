const APP_ID = import.meta.env.VITE_META_APP_ID;
const GRAPH_API_VERSION = 'v21.0';

let sdkReadyPromise = null;

function loadFacebookSdk() {
  if (sdkReadyPromise) return sdkReadyPromise;

  sdkReadyPromise = new Promise((resolve, reject) => {
    if (!APP_ID) {
      reject(new Error('VITE_META_APP_ID is not configured.'));
      return;
    }

    window.fbAsyncInit = function fbAsyncInit() {
      window.FB.init({ appId: APP_ID, cookie: true, xfbml: false, version: GRAPH_API_VERSION });
      resolve(window.FB);
    };

    if (document.getElementById('facebook-jssdk')) return;
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load the Facebook SDK.'));
    document.body.appendChild(script);
  });

  return sdkReadyPromise;
}

/**
 * Launches a Meta Embedded Signup / Facebook Login for Business popup for the given
 * configuration and resolves with the authorization code to send to the backend.
 * configId comes from the App Dashboard (WhatsApp > Configuration, or Facebook Login
 * for Business > Configurations) — see Settings for where to paste it once created.
 */
export async function launchMetaSignup(configId) {
  if (!configId) {
    throw new Error('This channel is not configured yet — add its Meta configuration ID first.');
  }

  const FB = await loadFacebookSdk();

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        const code = response?.authResponse?.code;
        if (code) {
          resolve(code);
        } else {
          reject(new Error('Signup was cancelled or did not complete.'));
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true
      }
    );
  });
}
