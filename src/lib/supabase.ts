import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvuhtfzsvcacyrlfettz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dWh0ZnpzdmNhY3lybGZldHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDk3OTYsImV4cCI6MjA4NTIyNTc5Nn0.vUtnPXeQrzU0kO0E7qK2qJtZ_RCqnXCEFSa60adHld0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AGENCIES = [
  { value: 'NIH', label: 'NIH - National Institutes of Health' },
  { value: 'NCI', label: 'NCI - National Cancer Institute' },
  { value: 'DoD_CDMRP', label: 'DoD CDMRP - Congressionally Directed Medical Research' },
  { value: 'CPRIT', label: 'CPRIT - Cancer Prevention Research Institute of Texas' },
  { value: 'NSF', label: 'NSF - National Science Foundation' },
  { value: 'SBIR', label: 'SBIR - Small Business Innovation Research' },
  { value: 'STTR', label: 'STTR - Small Business Technology Transfer' },
  { value: 'Foundation', label: 'Private Foundations' },
];

export const MECHANISMS = [
  { value: 'R01', label: 'R01 - Research Project Grant' },
  { value: 'R21', label: 'R21 - Exploratory/Developmental Grant' },
  { value: 'R03', label: 'R03 - Small Research Grant' },
  { value: 'K99/R00', label: 'K99/R00 - Pathway to Independence Award' },
  { value: 'F31', label: 'F31 - Predoctoral Fellowship' },
  { value: 'F32', label: 'F32 - Postdoctoral Fellowship' },
  { value: 'U01', label: 'U01 - Cooperative Agreement' },
  { value: 'P01', label: 'P01 - Program Project Grant' },
  { value: 'SBIR_Phase_I', label: 'SBIR Phase I - Feasibility Study' },
  { value: 'SBIR_Phase_II', label: 'SBIR Phase II - Full R&D' },
  { value: 'SBIR_Phase_IIB', label: 'SBIR Phase IIB - Commercialization' },
  { value: 'SBIR_Fast_Track', label: 'SBIR Fast Track - Combined I/II' },
  { value: 'STTR_Phase_I', label: 'STTR Phase I - Feasibility Study' },
  { value: 'STTR_Phase_II', label: 'STTR Phase II - Full R&D' },
  { value: 'STTR_Fast_Track', label: 'STTR Fast Track - Combined I/II' },
];

export const NIH_SALARY_CAP = 232200;

export interface Project {
  id: string;
  user_id: string;
  entry_state: string;
  project_type: string;
  target_agency: string;
  target_mechanism?: string;
  target_institute?: string;
  target_foa?: string;
  title?: string;
  concept: Record<string, unknown>;
  hypothesis: Record<string, unknown>;
  specific_aims: Record<string, unknown>;
  team: Record<string, unknown>;
  approach: Record<string, unknown>;
  budget: Record<string, unknown>;
  preliminary_data: Record<string, unknown>;
  summary_figure: Record<string, unknown>;
  review_simulation: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}
