import { FaBookOpen, FaUsers, FaUserPlus, FaBriefcase } from 'react-icons/fa';

// Onboarding step 2 — what the user wants to do (multi-select)
export const INTENTS = [
  { value: 'learn', label: 'Learn', tagline: 'Grow skills & knowledge', icon: FaBookOpen },
  { value: 'network', label: 'Network', tagline: 'Meet peers & build connections', icon: FaUsers },
  { value: 'hire', label: 'Hire', tagline: 'Find and recruit talent', icon: FaUserPlus },
  { value: 'get_hired', label: 'Get Hired', tagline: 'Discover roles & opportunities', icon: FaBriefcase }
];

// Onboarding step 3 — industry focus (multi-select)
export const INDUSTRIES = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'interiors', label: 'Interiors' },
  { value: 'construction', label: 'Construction' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'related', label: 'Related Fields' }
];
