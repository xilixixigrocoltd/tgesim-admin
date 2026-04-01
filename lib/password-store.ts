// 临时密码存储 - 仅用于初始化
let tempPassword: string | null = null;

export function setPassword(password: string): void {
  tempPassword = password;
}

export function getPassword(): string | null {
  return tempPassword;
}

export function validatePassword(input: string): boolean {
  return input === tempPassword;
}