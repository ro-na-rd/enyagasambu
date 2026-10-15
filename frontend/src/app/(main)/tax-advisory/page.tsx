'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { AlertCircle, CheckCircle, Check, ChevronLeft, ChevronRight, Clock, FileText, Loader2, Send, Shield, Upload, X } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition';
const labelCls = 'block text-xs font-semibold mb-1.5 text-gray-500';
const sectionCls = 'text-xs font-bold uppercase tracking-wider text-gray-400 mb-3';

const STEPS = [
  'Customer type',
  'Contact details',
  'Tax service',
  'Matter details',
  'Deadline',
  'Tax status & documents',
  'Consultation',
  'Privacy & submit',
];

const SERVICES: { value: string; label: string }[] = [
  { value: 'tax_registration', label: 'Tax registration' },
  { value: 'tax_compliance_review', label: 'Tax compliance review' },
  { value: 'income_tax', label: 'Income tax (personal income tax)' },
  { value: 'corporate_income_tax', label: 'Corporate income tax (CIT)' },
  { value: 'paye', label: 'PAYE' },
  { value: 'vat', label: 'VAT registration or filing' },
  { value: 'withholding_tax', label: 'Withholding tax' },
  { value: 'excise_duty', label: 'Excise duty' },
  { value: 'rental_income_tax', label: 'Rental income tax' },
  { value: 'property_tax', label: 'Property tax' },
  { value: 'trading_licence', label: 'Trading licence' },
  { value: 'capital_gains_property', label: 'Capital gains / sale of immovable property' },
  { value: 'tax_planning', label: 'Tax planning' },
  { value: 'tax_computation', label: 'Tax computation' },
  { value: 'tax_return_prep', label: 'Tax return preparation' },
  { value: 'tax_clearance', label: 'Tax clearance support' },
  { value: 'tax_audit_support', label: 'Tax audit or investigation support' },
  { value: 'tax_debt_penalty', label: 'Tax debt or penalty review' },
  { value: 'rra_notice_response', label: 'Response to an RRA notice' },
  { value: 'objection_appeal', label: 'Tax objection or appeal support' },
  { value: 'business_restructuring', label: 'Business restructuring or transaction advice' },
  { value: 'import_export_tax', label: 'Import and export tax advice' },
  { value: 'other', label: 'Other' },
];

const DOCUMENTS: { value: string; label: string }[] = [
  { value: 'tax_notices', label: 'Tax notices or assessment letters' },
  { value: 'prior_returns', label: 'Previous tax returns' },
  { value: 'financial_statements', label: 'Financial statements' },
  { value: 'trial_balance', label: 'Trial balance' },
  { value: 'general_ledger', label: 'General ledger' },
  { value: 'sales_purchase_reports', label: 'Sales and purchase reports' },
  { value: 'payroll_reports', label: 'Payroll reports' },
  { value: 'vat_records', label: 'VAT records' },
  { value: 'wht_certificates', label: 'Withholding tax certificates' },
  { value: 'bank_statements', label: 'Bank statements' },
  { value: 'rental_agreements', label: 'Rental agreements' },
  { value: 'property_documents', label: 'Property sale or purchase documents' },
  { value: 'registration_documents', label: 'Business registration documents' },
  { value: 'contracts', label: 'Contracts relevant to the tax issue' },
  { value: 'rra_correspondence', label: 'Correspondence with RRA' },
  { value: 'previous_opinions', label: 'Previous tax opinions or advice' },
];

const RECORDS: { value: string; label: string }[] = [
  { value: 'monthly_quarterly_records', label: 'Monthly or quarterly records maintained' },
  { value: 'sales_purchases', label: 'Sales and purchases recorded' },
  { value: 'payroll_records', label: 'Payroll records available' },
  { value: 'invoices_receipts', label: 'Invoices and receipts available' },
  { value: 'bank_statements', label: 'Bank statements available' },
  { value: 'prior_tax_returns', label: 'Prior tax returns available' },
];

interface FormState {
  customerType: 'individual' | 'business' | '';
  fullName: string;
  preferredName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  commMethod: string;
  preferredLanguage: string;
  bestTimeContact: string;
  businessName: string;
  tradingName: string;
  taxpayerId: string;
  businessType: string;
  industry: string;
  businessLocation: string;
  employeeCount: string;
  financialYearEnd: string;
  businessStartDate: string;
  contactPerson: string;
  contactPersonRole: string;
  isAuthorized: boolean;
  services: string[];
  otherService: string;
  description: string;
  desiredOutcome: string;
  background: string;
  issueStage: string;
  contactedRra: string;
  disputeKind: string;
  taxPeriod: string;
  amountInvolved: string;
  specificQuestions: string;
  existingClient: string;
  otherAdvisor: string;
  consentContactThirdParty: boolean;
  hasFilingDeadline: boolean;
  filingDeadline: string;
  hasRraNotice: boolean;
  noticeReceivedDate: string;
  noticeDeadline: string;
  pendingMatter: string;
  urgency: string;
  rraRegistered: string;
  hasTin: string;
  vatRegistered: string;
  payeRegistered: string;
  declarationsCurrent: string;
  unpaidTaxes: string;
  hasAssessment: string;
  previousObjection: string;
  currentAdvisor: string;
  booksAvailable: string;
  accountingSystem: string;
  recordsAvailable: string[];
  plannedDocuments: string[];
  consultationChannel: string;
  preferredDates: string;
  preferredTime: string;
  timezone: string;
  meetingLocation: string;
  accessibilityNeeds: string;
  consentProcess: boolean;
  consentMarketing: boolean;
  consentWhatsapp: boolean;
  accuracyConfirmed: boolean;
}

const INITIAL: FormState = {
  customerType: '',
  fullName: '',
  preferredName: '',
  phone: '',
  email: '',
  city: '',
  district: '',
  commMethod: '',
  preferredLanguage: '',
  bestTimeContact: '',
  businessName: '',
  tradingName: '',
  taxpayerId: '',
  businessType: '',
  industry: '',
  businessLocation: '',
  employeeCount: '',
  financialYearEnd: '',
  businessStartDate: '',
  contactPerson: '',
  contactPersonRole: '',
  isAuthorized: false,
  services: [],
  otherService: '',
  description: '',
  desiredOutcome: '',
  background: '',
  issueStage: '',
  contactedRra: '',
  disputeKind: '',
  taxPeriod: '',
  amountInvolved: '',
  specificQuestions: '',
  existingClient: '',
  otherAdvisor: '',
  consentContactThirdParty: false,
  hasFilingDeadline: false,
  filingDeadline: '',
  hasRraNotice: false,
  noticeReceivedDate: '',
  noticeDeadline: '',
  pendingMatter: '',
  urgency: 'general',
  rraRegistered: '',
  hasTin: '',
  vatRegistered: '',
  payeRegistered: '',
  declarationsCurrent: '',
  unpaidTaxes: '',
  hasAssessment: '',
  previousObjection: '',
  currentAdvisor: '',
  booksAvailable: '',
  accountingSystem: '',
  recordsAvailable: [],
  plannedDocuments: [],
  consultationChannel: '',
  preferredDates: '',
  preferredTime: '',
  timezone: 'CAT (UTC+2)',
  meetingLocation: '',
  accessibilityNeeds: '',
  consentProcess: false,
  consentMarketing: false,
  consentWhatsapp: false,
  accuracyConfirmed: false,
};

function validateStep(step: number, f: FormState): string | null {
  switch (step) {
    case 0:
      return f.customerType ? null : 'Choose whether you are an individual or a business';
    case 1: {
      if (!f.fullName.trim()) return 'Full name is required';
      if (!f.phone.trim()) return 'Phone number is required';
      if (!/^\+?[0-9][0-9\s\-()]{6,24}$/.test(f.phone.trim())) return 'Enter a valid phone number (e.g. +250 7XX XXX XXX)';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Enter a valid email address';
      if (!f.commMethod) return 'Choose a preferred communication method';
      if (f.customerType === 'business') {
        if (!f.businessName.trim()) return 'Registered business name is required';
        if (!f.contactPerson.trim()) return 'Contact person is required';
        if (!f.isAuthorized) return 'Confirm that you are authorized to act for the business';
      }
      return null;
    }
    case 2:
      return f.services.length ? null : 'Select at least one tax service';
    case 3: {
      if (f.description.trim().length < 20) return 'Describe the tax issue in at least 20 characters';
      if (!f.taxPeriod.trim()) return 'Tax period or financial year is required';
      return null;
    }
    case 4:
      return f.urgency ? null : 'Select the urgency level';
    case 6:
      return f.consultationChannel ? null : 'Choose a preferred consultation channel';
    default:
      return null;
  }
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required ? ' *' : ''}</label>
      {children}
      {hint ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
    </div>
  );
}

function CheckGroup({ options, selected, onToggle }: { options: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label key={o.value}
          className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition hover:border-[#E85D04]"
          style={{ borderColor: selected.includes(o.value) ? ORG : '#e5e7eb' }}>
          <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)}
            className="mt-0.5 shrink-0" style={{ accentColor: ORG }} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function YesNo({ label, name, value, onChange, required }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <select name={name} value={value} onChange={onChange} className={inputCls}>
        <option value="">Select…</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </Field>
  );
}

export default function TaxAdvisoryPage() {
  const [f, setF] = useState<FormState>(INITIAL);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
  };

  const onField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const t = e.target;
    const value = t instanceof HTMLInputElement && t.type === 'checkbox' ? t.checked : t.value;
    setF((prev) => ({ ...prev, [t.name]: value }));
  };

  const toggleIn = (key: 'services' | 'recordsAvailable' | 'plannedDocuments', value: string) => {
    setF((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setError('');
    const valid: File[] = [];
    for (const file of list) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" is larger than 5MB and was not added.`);
        continue;
      }
      valid.push(file);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = '';
  };

  const next = () => {
    const err = validateStep(step, f);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!f.consentProcess) {
      setError('Consent to process your request is required.');
      return;
    }
    if (!f.accuracyConfirmed) {
      setError('Please confirm that the information provided is accurate.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('payload', JSON.stringify(f));
      files.forEach((file) => fd.append('documents', file));
      const { data } = await api.post('/tax-advisory', fd);
      setReference(data.reference);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#d1fae5' }}>
            <CheckCircle size={32} style={{ color: '#059669' }} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Your request has been received</h1>
          <p className="text-sm text-gray-500 mb-4">
            Reference: <span className="font-bold" style={{ color: NAVY }}>{reference}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Our team will review it and contact you using your preferred communication method.
          </p>
          <button onClick={() => { setF(INITIAL); setFiles([]); setStep(0); setReference(''); }}
            className="text-sm font-bold px-5 py-2.5 rounded-lg text-white transition hover:opacity-90"
            style={{ background: ORG }}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="text-white py-14 px-4" style={{ background: `linear-gradient(135deg, ${NAVY} 60%, ${ORG} 100%)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4"><Shield size={44} /></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Tax Advisory Services</h1>
          <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto">
            Request expert help with RRA taxes — income tax, CIT, PAYE, VAT, withholding tax, trading licence and more.
            This short form helps us understand and route your request.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* ── Progress ── */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((title, i) => (
            <div key={title} title={title}
              onClick={() => { if (i < step) { setError(''); setStep(i); } }}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ flex: 1, background: i <= step ? ORG : 'rgba(0,0,0,0.08)', cursor: i < step ? 'pointer' : 'default' }} />
          ))}
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STEPS.map((title, i) => (
            <button key={title} type="button"
              onClick={() => { if (i < step) { setError(''); setStep(i); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
              style={{
                background: i === step ? `${ORG}12` : 'transparent',
                color: i === step ? NAVY : i < step ? ORG : 'rgba(0,0,0,0.35)',
                border: i === step ? `1px solid ${ORG}55` : '1px solid transparent',
              }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold"
                style={{ background: i < step ? ORG : i === step ? `${ORG}22` : 'rgba(0,0,0,0.05)', color: i <= step ? '#fff' : 'rgba(0,0,0,0.3)' }}>
                {i < step ? <Check size={9} /> : i + 1}
              </span>
              {title}
            </button>
          ))}
        </div>

        {/* ── Step card ── */}
        <div className="rounded-2xl bg-white border border-gray-100" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }}>
          <div className="p-6 sm:p-8">
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: ORG }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">{STEPS[step]}</h2>

            {/* ── Step 1: Customer type ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { v: 'individual', t: 'Individual', d: 'Personal tax matters: income tax, PAYE, rental income tax, trading licence, sale of property.' },
                    { v: 'business', t: 'Business', d: 'Company, partnership or non-profit matters: CIT, VAT, payroll, excise duty, imports and exports.' },
                  ].map((opt) => (
                    <button key={opt.v} type="button" onClick={() => set('customerType', opt.v as 'individual' | 'business')}
                      className="text-left rounded-xl p-5 border transition"
                      style={{ borderColor: f.customerType === opt.v ? ORG : '#e5e7eb', background: f.customerType === opt.v ? `${ORG}08` : '#fff' }}>
                      <p className="font-bold text-gray-900 mb-1">{opt.t}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{opt.d}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs rounded-xl px-4 py-3"
                  style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>We only ask for the minimum information needed to understand and route your request.
                    National ID, bank details and financial records are never required at this stage.</span>
                </div>
              </div>
            )}

            {/* ── Step 2: Contact details ── */}
            {step === 1 && (
              <div className="space-y-5">
                {f.customerType === 'business' && (
                  <div className="space-y-4">
                    <p className={sectionCls}>Business details</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Registered business name" required>
                        <input name="businessName" value={f.businessName} onChange={onField} className={inputCls} placeholder="e.g. Uwase Trading Ltd" />
                      </Field>
                      <Field label="Trading name or DBA (if different)">
                        <input name="tradingName" value={f.tradingName} onChange={onField} className={inputCls} placeholder="e.g. Uwase Store" />
                      </Field>
                      <Field label="Taxpayer identification number (TIN)" hint="Optional at this stage.">
                        <input name="taxpayerId" value={f.taxpayerId} onChange={onField} className={inputCls} placeholder="TIN (optional)" />
                      </Field>
                      <Field label="Business type">
                        <select name="businessType" value={f.businessType} onChange={onField} className={inputCls}>
                          <option value="">Select…</option>
                          <option value="individual_enterprise">Individual enterprise</option>
                          <option value="partnership">Partnership</option>
                          <option value="company">Company</option>
                          <option value="non_profit">Non-profit organization</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="Industry or business activity">
                        <input name="industry" value={f.industry} onChange={onField} className={inputCls} placeholder="e.g. Retail, farming, transport" />
                      </Field>
                      <Field label="Business location">
                        <input name="businessLocation" value={f.businessLocation} onChange={onField} className={inputCls} placeholder="Sector / District" />
                      </Field>
                      <Field label="Number of employees">
                        <input name="employeeCount" value={f.employeeCount} onChange={onField} inputMode="numeric" className={inputCls} placeholder="e.g. 12" />
                      </Field>
                      <Field label="Financial year-end">
                        <input name="financialYearEnd" value={f.financialYearEnd} onChange={onField} className={inputCls} placeholder="e.g. 31 December" />
                      </Field>
                      <Field label="Date the business started operating">
                        <input name="businessStartDate" type="date" value={f.businessStartDate} onChange={onField} className={inputCls} />
                      </Field>
                      <Field label="Contact person's role" required>
                        <input name="contactPersonRole" value={f.contactPersonRole} onChange={onField} className={inputCls} placeholder="e.g. Director" />
                      </Field>
                    </div>
                    <Field label="Contact person" required>
                      <input name="contactPerson" value={f.contactPerson} onChange={onField} className={inputCls} placeholder="Full name of the person we will speak to" />
                    </Field>
                    <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                      <input type="checkbox" name="isAuthorized" checked={f.isAuthorized} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                      <span>I confirm that I am authorized to provide this information and request services on behalf of the organization.</span>
                    </label>
                    <div className="border-t border-gray-100 pt-4" />
                  </div>
                )}

                <p className={sectionCls}>Your contact information</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full legal name" required>
                    <input name="fullName" value={f.fullName} onChange={onField} className={inputCls} placeholder="Your full name" />
                  </Field>
                  <Field label="Preferred name">
                    <input name="preferredName" value={f.preferredName} onChange={onField} className={inputCls} placeholder="What should we call you?" />
                  </Field>
                  <Field label="Phone number" required hint="Preferably with country code, e.g. +250 7XX XXX XXX">
                    <input name="phone" value={f.phone} onChange={onField} className={inputCls} placeholder="+250 7XX XXX XXX" />
                  </Field>
                  <Field label="Email address" required>
                    <input name="email" type="email" value={f.email} onChange={onField} className={inputCls} placeholder="you@example.com" />
                  </Field>
                  <Field label="City">
                    <input name="city" value={f.city} onChange={onField} className={inputCls} placeholder="e.g. Kigali" />
                  </Field>
                  <Field label="District">
                    <input name="district" value={f.district} onChange={onField} className={inputCls} placeholder="e.g. Kicukiro" />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Preferred communication method" required>
                    <select name="commMethod" value={f.commMethod} onChange={onField} className={inputCls}>
                      <option value="">Select…</option>
                      <option value="phone_call">Phone call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="in_person">In-person meeting</option>
                      <option value="video">Video meeting</option>
                    </select>
                  </Field>
                  <Field label="Preferred language">
                    <select name="preferredLanguage" value={f.preferredLanguage} onChange={onField} className={inputCls}>
                      <option value="">Select…</option>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="rw">Kinyarwanda</option>
                    </select>
                  </Field>
                  <Field label="Best time to contact you">
                    <input name="bestTimeContact" value={f.bestTimeContact} onChange={onField} className={inputCls} placeholder="e.g. Weekday mornings" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 3: Tax service ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Select one or more areas you need help with. Rwanda&apos;s tax system covers many distinct taxes,
                  so a specific selection helps us assign the right adviser.
                </p>
                <CheckGroup options={SERVICES} selected={f.services} onToggle={(v) => toggleIn('services', v)} />
                {f.services.includes('other') && (
                  <Field label="Please describe the service you need" required>
                    <input name="otherService" value={f.otherService} onChange={onField} className={inputCls} placeholder="Briefly describe the tax service" />
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 4: Matter details ── */}
            {step === 3 && (
              <div className="space-y-5">
                <Field label="Please describe the tax issue, question, or decision for which you need advice" required>
                  <textarea name="description" value={f.description} onChange={onField} rows={5} className={`${inputCls} resize-y`}
                    placeholder="Describe your situation clearly — what happened, what you need, and any deadlines involved." />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="What outcome do you want from this consultation?">
                    <textarea name="desiredOutcome" value={f.desiredOutcome} onChange={onField} rows={3} className={`${inputCls} resize-y`}
                      placeholder="e.g. A correct VAT filing, a response to an RRA notice…" />
                  </Field>
                  <Field label="What has already happened?">
                    <textarea name="background" value={f.background} onChange={onField} rows={3} className={`${inputCls} resize-y`}
                      placeholder="Events so far, notices received, steps already taken…" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Is this a new issue or an ongoing matter?">
                    <select name="issueStage" value={f.issueStage} onChange={onField} className={inputCls}>
                      <option value="">Select…</option>
                      <option value="new">New issue</option>
                      <option value="ongoing">Ongoing matter</option>
                    </select>
                  </Field>
                  <Field label="Have you already contacted RRA or another adviser?">
                    <select name="contactedRra" value={f.contactedRra} onChange={onField} className={inputCls}>
                      <option value="">Select…</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </Field>
                  <Field label="Is there a disagreement, penalty, audit, or compliance risk?">
                    <select name="disputeKind" value={f.disputeKind} onChange={onField} className={inputCls}>
                      <option value="">Select…</option>
                      <option value="none">None of these</option>
                      <option value="disagreement">Disagreement with RRA</option>
                      <option value="penalty">Penalty</option>
                      <option value="audit">Audit</option>
                      <option value="compliance_risk">Compliance risk</option>
                    </select>
                  </Field>
                  <Field label="Tax period or financial year involved" required>
                    <input name="taxPeriod" value={f.taxPeriod} onChange={onField} className={inputCls} placeholder="e.g. FY2025 or Jan–Mar 2026" />
                  </Field>
                  <Field label="Approximate amount involved (RWF)" hint="Optional — only if known.">
                    <input name="amountInvolved" value={f.amountInvolved} onChange={onField} className={inputCls} placeholder="e.g. 2,500,000" />
                  </Field>
                </div>
                <Field label="What specific questions should the adviser answer?">
                  <textarea name="specificQuestions" value={f.specificQuestions} onChange={onField} rows={3} className={`${inputCls} resize-y`}
                    placeholder="List the exact questions you want answered…" />
                </Field>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <p className={sectionCls}>Conflict check</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Are you an existing client of ours?">
                      <select name="existingClient" value={f.existingClient} onChange={onField} className={inputCls}>
                        <option value="">Select…</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </Field>
                    <Field label="Is another adviser or firm handling this matter?" hint="Leave blank if nobody else is involved.">
                      <input name="otherAdvisor" value={f.otherAdvisor} onChange={onField} className={inputCls} placeholder="Name of adviser or firm (optional)" />
                    </Field>
                  </div>
                  <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                    <input type="checkbox" name="consentContactThirdParty" checked={f.consentContactThirdParty} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                    <span>You may contact other authorized parties involved in this matter, if necessary.</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── Step 5: Deadline ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Submitting this form does not automatically extend any tax filing, payment, objection, or appeal deadline.</span>
                </div>

                <label className="flex items-center gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                  <input type="checkbox" name="hasFilingDeadline" checked={f.hasFilingDeadline} onChange={onField} className="shrink-0" style={{ accentColor: ORG }} />
                  <span>Is there a filing deadline?</span>
                </label>
                {f.hasFilingDeadline && (
                  <Field label="Date of the filing deadline" required>
                    <input name="filingDeadline" type="date" value={f.filingDeadline} onChange={onField} className={inputCls} />
                  </Field>
                )}

                <label className="flex items-center gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                  <input type="checkbox" name="hasRraNotice" checked={f.hasRraNotice} onChange={onField} className="shrink-0" style={{ accentColor: ORG }} />
                  <span>Is there an RRA notice or response deadline?</span>
                </label>
                {f.hasRraNotice && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Date the notice was received" required>
                      <input name="noticeReceivedDate" type="date" value={f.noticeReceivedDate} onChange={onField} className={inputCls} />
                    </Field>
                    <Field label="Date of the response deadline" required>
                      <input name="noticeDeadline" type="date" value={f.noticeDeadline} onChange={onField} className={inputCls} />
                    </Field>
                  </div>
                )}

                <Field label="Is there a pending audit, assessment, penalty, objection, or appeal?">
                  <select name="pendingMatter" value={f.pendingMatter} onChange={onField} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="none">None</option>
                    <option value="audit">Audit</option>
                    <option value="assessment">Assessment</option>
                    <option value="penalty">Penalty</option>
                    <option value="objection">Objection</option>
                    <option value="appeal">Appeal</option>
                  </select>
                </Field>

                <div>
                  <p className={labelCls}>Urgency *</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { v: 'general', l: 'General enquiry' },
                      { v: 'one_week', l: 'Needed within one week' },
                      { v: 'three_days', l: 'Needed within three business days' },
                      { v: 'urgent', l: 'Urgent or deadline-sensitive' },
                    ].map((o) => (
                      <label key={o.v}
                        className="flex items-center gap-2.5 text-sm text-gray-700 bg-white border rounded-xl px-4 py-3 cursor-pointer transition"
                        style={{ borderColor: f.urgency === o.v ? ORG : '#e5e7eb', background: f.urgency === o.v ? `${ORG}08` : '#fff' }}>
                        <input type="radio" name="urgency" value={o.v} checked={f.urgency === o.v} onChange={onField}
                          className="shrink-0" style={{ accentColor: ORG }} />
                        <span className="flex items-center gap-1.5">
                          {o.v === 'urgent' && <Clock size={13} style={{ color: ORG }} />}{o.l}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 6: Tax status & documents ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <p className={sectionCls}>Existing tax and compliance status</p>
                  <p className="text-xs text-gray-400 mb-3">Answer only what is relevant to your selected service.</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <YesNo label="Registered with RRA?" name="rraRegistered" value={f.rraRegistered} onChange={onField} />
                    <YesNo label="Do you have a TIN?" name="hasTin" value={f.hasTin} onChange={onField} />
                    <YesNo label="VAT registered?" name="vatRegistered" value={f.vatRegistered} onChange={onField} />
                    <YesNo label="Registered as employer (PAYE)?" name="payeRegistered" value={f.payeRegistered} onChange={onField} />
                    <YesNo label="Declarations up to date?" name="declarationsCurrent" value={f.declarationsCurrent} onChange={onField} />
                    <YesNo label="Unpaid taxes or penalties?" name="unpaidTaxes" value={f.unpaidTaxes} onChange={onField} />
                    <YesNo label="Received a tax assessment?" name="hasAssessment" value={f.hasAssessment} onChange={onField} />
                    <YesNo label="Filed an objection or appeal before?" name="previousObjection" value={f.previousObjection} onChange={onField} />
                    <YesNo label="Are books and records available?" name="booksAvailable" value={f.booksAvailable} onChange={onField} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <Field label="Who currently handles your accounting or tax work?">
                      <input name="currentAdvisor" value={f.currentAdvisor} onChange={onField} className={inputCls} placeholder="e.g. In-house, firm name, nobody" />
                    </Field>
                    <Field label="Which accounting system is used?">
                      <input name="accountingSystem" value={f.accountingSystem} onChange={onField} className={inputCls} placeholder="e.g. QuickBooks, spreadsheets" />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className={sectionCls}>Records available (businesses)</p>
                  <CheckGroup options={RECORDS} selected={f.recordsAvailable} onToggle={(v) => toggleIn('recordsAvailable', v)} />
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className={sectionCls}>Documents for review (optional)</p>
                  <p className="text-xs text-gray-400">
                    Tick what you already have, and attach files if you wish — this is optional at the enquiry stage.
                    Uploads go to private, encrypted storage; only assigned staff can access them.
                  </p>
                  <CheckGroup options={DOCUMENTS} selected={f.plannedDocuments} onToggle={(v) => toggleIn('plannedDocuments', v)} />
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={onFiles}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white file:cursor-pointer"
                    style={{ accentColor: ORG }} />
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, idx) => (
                      <span key={`${file.name}-${idx}`} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700">
                        <FileText size={12} />{file.name}
                        <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500" aria-label={`Remove ${file.name}`}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">PDF, JPG, PNG, WEBP, DOC or DOCX — max 5MB each, up to 5 files.</p>
                </div>
              </div>
            )}

            {/* ── Step 7: Consultation ── */}
            {step === 6 && (
              <div className="space-y-5">
                <Field label="How would you like the advisory service delivered?" required>
                  <select name="consultationChannel" value={f.consultationChannel} onChange={onField} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="phone">Phone consultation</option>
                    <option value="video">Video call</option>
                    <option value="whatsapp">WhatsApp consultation</option>
                    <option value="email">Email advice</option>
                    <option value="in_person">In-person meeting</option>
                    <option value="written_opinion">Written tax opinion</option>
                    <option value="ongoing_monthly">Ongoing monthly advisory</option>
                    <option value="one_time">One-time consultation</option>
                  </select>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Preferred appointment dates">
                    <input name="preferredDates" value={f.preferredDates} onChange={onField} className={inputCls} placeholder="e.g. 15–17 October 2026" />
                  </Field>
                  <Field label="Preferred time">
                    <input name="preferredTime" value={f.preferredTime} onChange={onField} className={inputCls} placeholder="e.g. 09:00–12:00" />
                  </Field>
                  <Field label="Time zone">
                    <input name="timezone" value={f.timezone} onChange={onField} className={inputCls} />
                  </Field>
                  <Field label="Meeting location (if applicable)">
                    <input name="meetingLocation" value={f.meetingLocation} onChange={onField} className={inputCls} placeholder="e.g. Our Kigali office, your premises" />
                  </Field>
                </div>
                <Field label="Interpretation or accessibility support needed?">
                  <input name="accessibilityNeeds" value={f.accessibilityNeeds} onChange={onField} className={inputCls} placeholder="e.g. Kinyarwanda interpretation, wheelchair access" />
                </Field>
              </div>
            )}

            {/* ── Step 8: Privacy & submit ── */}
            {step === 7 && (
              <div className="space-y-5">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-3">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><Shield size={15} style={{ color: NAVY }} /> Privacy notice</p>
                  <ul className="text-xs text-gray-500 leading-relaxed space-y-1.5 list-disc pl-4">
                    <li><strong>Who collects:</strong> E-Nyagasambu, Kigali, Rwanda, as data controller.</li>
                    <li><strong>Why:</strong> to assess and respond to your tax advisory request, and to assign it to an adviser.</li>
                    <li><strong>Required vs optional:</strong> fields marked * are mandatory; documents, marketing and WhatsApp consents are optional.</li>
                    <li><strong>Who accesses it:</strong> assigned advisers and authorized staff only. Documents are stored in private storage with access logging.</li>
                    <li><strong>Sharing:</strong> never shared with third parties without your separate consent, except where required by law.</li>
                    <li><strong>Retention:</strong> kept only as long as needed to handle your request and meet legal obligations, then deleted.</li>
                    <li><strong>Your rights:</strong> access, correction, deletion and withdrawal of consent — contact us via the Support page.</li>
                    <li><strong>Links:</strong> <a href="/privacy" className="underline" style={{ color: ORG }}>Privacy policy</a>, <a href="/terms" className="underline" style={{ color: ORG }}>Terms of service</a>.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border rounded-xl px-4 py-3 cursor-pointer"
                  style={{ borderColor: f.consentProcess ? ORG : '#e5e7eb' }}>
                  <input type="checkbox" name="consentProcess" checked={f.consentProcess} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                  <span>
                    I agree that E-Nyagasambu may process the information I submit for the purpose of assessing and
                    responding to my tax advisory request. I understand that I may withdraw this consent, subject to
                    legal and contractual requirements. <strong>(Required)</strong>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                  <input type="checkbox" name="consentWhatsapp" checked={f.consentWhatsapp} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                  <span>You may contact me through WhatsApp. (Optional)</span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                  <input type="checkbox" name="consentMarketing" checked={f.consentMarketing} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                  <span>Send me newsletters and tax-related updates. (Optional)</span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-gray-700 bg-white border rounded-xl px-4 py-3 cursor-pointer"
                  style={{ borderColor: f.accuracyConfirmed ? ORG : '#e5e7eb' }}>
                  <input type="checkbox" name="accuracyConfirmed" checked={f.accuracyConfirmed} onChange={onField} className="mt-0.5" style={{ accentColor: ORG }} />
                  <span>I confirm that the information provided in this request is accurate to the best of my knowledge. <strong>(Required)</strong></span>
                </label>

                {f.customerType === 'business' && (
                  <div className="flex items-start gap-2 text-xs rounded-xl px-4 py-3"
                    style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Business authorization: I confirm that I am authorized to provide this information and
                      request services on behalf of the organization.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mt-5"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* ── Footer nav ── */}
          <div className="px-6 sm:px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-3">
            <button type="button" onClick={back} disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} /> Back
            </button>
            <span className="text-xs text-gray-400 font-semibold hidden sm:block">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
                style={{ background: ORG }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: ORG }}>
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-4 flex items-center justify-center gap-1.5">
          <Upload size={12} /> This is an initial triage form — sensitive documents can be exchanged later through a secure channel.
        </p>
      </div>
    </div>
  );
}
