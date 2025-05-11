export const PASSWORD_MIN_LENGTH = 5
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/
export const PASSWORD_REGEX_ERROR =
  "Password must contain at least one uppercase letter, one number, and one special character"
