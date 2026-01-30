export interface Settings {
  id: string;
  daily_maturity_weeks: number;
  weekly_maturity_months: number;
  created_at: string;
  updated_at: string;
}

export interface CustomScript {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
  position: 'head' | 'body';
}

export interface SiteSettings {
  id: string;
  site_name: string;
  site_icon_url: string | null;
  support_whatsapp: string | null;
  support_email: string | null;
  custom_scripts: CustomScript[] | null;
  created_at: string;
  updated_at: string;
}

export type FrequencyType = 'DAILY' | 'WEEKLY';
export type EnrollmentStatus = 'ACTIVE' | 'MATURED' | 'PAID' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Plan {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: FrequencyType;
  total_slots: number;
  available_slots: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  plan_id: string;
  frequency: FrequencyType;
  contribution_amount: number;
  multiplier: number;
  enrollment_date: string;
  maturity_date: string;
  payout_amount: number;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  proof_screenshot_url: string | null;
  proof_url: string | null; // Alias for proof_screenshot_url
  payment_method_id: string | null;
  payment_method_name: string | null; // Added for joined queries
  transaction_id: string | null; // Added for transaction reference
  verified_by: string | null;
  status: PaymentStatus;
  notes: string | null;
  admin_notes: string | null; // Added for admin rejection notes
  created_at: string;
  updated_at: string;
  enrollment?: Enrollment;
  payment_method?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  name: string;
  account_identifier: string;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
