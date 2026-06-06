import React from 'react';
import { FaLinkedin } from 'react-icons/fa';
import { toast } from 'sonner';
import GoogleAuthButton from './GoogleAuthButton';

/**
 * Social sign-in block: working Google sign-in plus a clearly-labeled
 * LinkedIn "coming soon" button (disabled — no dummy behavior).
 */
const SocialAuth = ({ onGoogleCredential, text = 'continue_with' }) => (
  <div className="mt-6">
    <div className="flex items-center gap-3 mb-5">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>

    <div className="space-y-3">
      <GoogleAuthButton onCredential={onGoogleCredential} text={text} />

      <button
        type="button"
        onClick={() => toast.info('LinkedIn sign-in is coming soon')}
        className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-not-allowed"
        aria-disabled="true"
        data-testid="linkedin-soon"
      >
        <FaLinkedin className="text-[#0A66C2] text-lg" />
        Continue with LinkedIn
        <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Soon
        </span>
      </button>
    </div>
  </div>
);

export default SocialAuth;
