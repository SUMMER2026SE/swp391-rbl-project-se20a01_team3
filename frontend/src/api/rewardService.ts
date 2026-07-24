import { apiClient } from './client';

export type StudentRewardVoucherStatus = 'AVAILABLE' | 'RESERVED' | 'USED';
export type RewardPointTransactionType = 'EXAM_REWARD' | 'VOUCHER_REDEMPTION';

export interface RewardVoucher {
  id: string;
  code: string;
  displayName: string;
  requiredPoints: number;
  discountAmount: number;
  active: boolean;
}

export interface StudentRewardVoucher {
  id: string;
  voucherId: string;
  code: string;
  displayName: string;
  discountAmount: number;
  status: StudentRewardVoucherStatus;
  redeemedAt: string;
  usedAt: string | null;
}

export interface RewardPointTransaction {
  id: string;
  type: RewardPointTransactionType;
  pointsDelta: number;
  referenceId: string | null;
  title: string;
  description: string | null;
  scorePercent: number | null;
  createdAt: string;
}

export interface RewardWallet {
  availablePoints: number;
  lifetimePoints: number;
  catalog: RewardVoucher[];
  vouchers: StudentRewardVoucher[];
  transactions: RewardPointTransaction[];
}

export async function getRewardWallet(): Promise<RewardWallet> {
  const res = await apiClient.get('/api/rewards/wallet');
  return res.data.data;
}

export async function redeemRewardVoucher(voucherId: string): Promise<RewardWallet> {
  const res = await apiClient.post(`/api/rewards/vouchers/${voucherId}/redeem`);
  return res.data.data;
}
