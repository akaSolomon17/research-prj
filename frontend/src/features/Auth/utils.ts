export interface LoginFormValues {
  email: string;
  password: string;
}

export const validateLoginForm = (values: LoginFormValues): string | null => {
  const email = values.email.trim();
  const password = values.password.trim();

  if (!email || !password) {
    return "Email and password are required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email format is invalid.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
};
