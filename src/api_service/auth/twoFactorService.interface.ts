export interface TwoFactorSetupResponse {
  secretKey?: string;
  qrCodeUrl?: string;
  type: string;
  verified: boolean;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  type?: string;
  remainingBackupCodes: number;
}

export interface TwoFactorEnableResponse {
  backupCodes: string[];
  success: boolean;
  message: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: boolean;
  tempToken: string;
  twoFactorType: string;
  message: string;
}

export interface TwoFactorSetupRequest {
  type: 'TOTP' | 'EMAIL';
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorLoginRequest {
  tempToken: string;
  code: string;
}
