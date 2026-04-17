export const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

export const formatSSN = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
};

export const formatEIN = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
};

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPassword = (password) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

export const isValidPhone = (phone) =>
  phone.replace(/\D/g, '').length === 10;

export const isValidSSN = (ssn) =>
  ssn.replace(/\D/g, '').length === 9;

export const isValidEIN = (ein) =>
  ein.replace(/\D/g, '').length === 9;
