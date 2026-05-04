export const validators = {
  email: (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  password: (password: string) => {
    return password.length >= 6;
  },
  fullName: (name: string) => {
    return name.length >= 3;
  },
  classCode: (code: string) => {
    return /^[A-Z0-9]{6}$/.test(code);
  }
};
