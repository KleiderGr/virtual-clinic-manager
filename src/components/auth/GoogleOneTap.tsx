import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Extend window interface to include Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const { user, signInWithIdToken } = useAuth();
  const clientId = "56666810540-dpnd6md6u598c9j47coo5t3h15oadsb5.apps.googleusercontent.com";

  useEffect(() => {
    // Don't show if user is already logged in
    if (user) return;

    const scriptId = 'google-one-tap-script';
    
    // Function to initialize Google One Tap
    const initializeGoogleOneTap = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            await signInWithIdToken(response.credential);
          } catch (error) {
            console.error('Google One Tap error:', error);
          }
        },
        auto_select: true, // Try to automatically select the account
        cancel_on_tap_outside: false, // Optional: prevent closing by clicking outside
        use_fedcm_for_prompt: true, // Force FedCM which is required by newer Chrome versions
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log('Google One Tap not displayed. Reason:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.log('Google One Tap skipped. Reason:', reason);
          
          // Debug help: show toast if it's a configuration issue, but ignore user_cancel/tap_outside
          if (reason !== 'user_cancel' && reason !== 'tap_outside') {
             console.warn('One Tap skipped due to:', reason);
          }
        } else if (notification.isDismissedMoment()) {
          console.log('Google One Tap dismissed. Reason:', notification.getDismissedReason());
        }
      });
    };

    // Load the script if it doesn't exist
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = initializeGoogleOneTap;
      document.body.appendChild(script);
    } else {
      // If script is already loaded, initialize immediately
      if (window.google) {
        initializeGoogleOneTap();
      } else {
        // Wait for it to load if it's in the DOM but object not ready (edge case)
        const checkGoogle = setInterval(() => {
          if (window.google) {
            initializeGoogleOneTap();
            clearInterval(checkGoogle);
          }
        }, 100);
      }
    }
    
    return () => {
      // Clean up if needed? potentially disable auto select or cancel prompt?
      // window.google?.accounts.id.cancel(); // If strict cleanup needed
    };
  }, [user, signInWithIdToken, clientId]);

  return null; // This component doesn't render any visible DOM elements itself
}
