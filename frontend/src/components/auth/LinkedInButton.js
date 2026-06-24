import React from 'react';
import { FaLinkedin } from 'react-icons/fa';

const CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
export const LINKEDIN_ENABLED = !!CLIENT_ID;

// Starts the LinkedIn OpenID Connect authorization-code flow by redirecting
// to LinkedIn. The callback page (/auth/linkedin/callback) finishes sign-in.
const LinkedInButton = () => {
  if (!CLIENT_ID) return null;

  const start = () => {
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('li_oauth_state', state);
    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
    const url =
      'https://www.linkedin.com/oauth/v2/authorization?response_type=code' +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&state=${encodeURIComponent(state)}`;
    window.location.href = url;
  };

  return (
    <button
      type="button"
      onClick={start}
      className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      data-testid="linkedin-signin"
    >
      <FaLinkedin className="text-[#0A66C2] text-lg" />
      Continue with LinkedIn
    </button>
  );
};

export default LinkedInButton;
