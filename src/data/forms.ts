export type FormFieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'tel' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'file'
  | 'team-members';

export type CompetitionScope = 
  | 'inter-school' 
  | 'inner-school' 
  | 'all-island-open' 
  | 'invitational' 
  | 'online';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select, radio, checkbox
  helpText?: string;
  teamConfig?: {
    memberCount?: number;
    includePhone?: boolean;
    includeGrade?: boolean;
  };
}

export interface PostSubmitConfig {
  successTitle?: string;
  successMessage?: string;
  whatsappGroupLink?: string;
  whatsappGroupLabel?: string;
  telegramGroupLink?: string;
  customNotice?: string;
}

export interface CompetitionForm {
  id: string;
  slug: string;
  title: string;
  description: string;
  scope: CompetitionScope;
  category?: string; // 'Senior', 'Junior', 'Primary', 'Open'
  accentColor?: string; // e.g. '#dc2626'
  submitButtonText?: string; // Custom label on submit button
  submitButtonColor?: string; // Primary button background/gradient start
  submitButtonGradientEnd?: string; // Gradient end color
  submitButtonTextColor?: string; // Text color on submit button
  competitionSlug?: string;
  competitionTitle?: string;
  isStandalone?: boolean; // For General Forms, Day Invites, Events
  isActive: boolean;
  deadline?: string;
  limitOneResponse?: boolean;
  fields: FormField[];
  postSubmitConfig?: PostSubmitConfig;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  referralId?: string;
  formId: string;
  formTitle: string;
  competitionSlug?: string;
  competitionTitle?: string;
  scope: CompetitionScope;
  category?: string;
  submittedAt: string;
  status: 'confirmed' | 'pending' | 'rejected';
  data: Record<string, any>;
  teamMembers?: Array<{ name: string; grade?: string; role?: string; contact?: string }>;
}

export const sampleForms: CompetitionForm[] = [];
export const sampleSubmissions: FormSubmission[] = [];
