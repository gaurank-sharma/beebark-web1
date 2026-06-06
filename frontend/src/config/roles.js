import { FaUserGraduate, FaUserTie, FaBuilding } from 'react-icons/fa';

// Account types a user can pick at signup. The `value` is what the backend
// stores in `user.role` and what future features should gate functionality on.
export const ROLES = [
  {
    value: 'student',
    label: 'Student',
    tagline: 'Learn, find internships & mentorship',
    icon: FaUserGraduate
  },
  {
    value: 'professional',
    label: 'Professional',
    tagline: 'Architect, designer, engineer, contractor & more',
    icon: FaUserTie
  },
  {
    value: 'firm',
    label: 'Firm',
    tagline: 'Represent a studio, practice, or company',
    icon: FaBuilding
  }
];

export const ROLE_VALUES = ROLES.map((r) => r.value);

export const getRole = (value) => ROLES.find((r) => r.value === value);
