import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  calculateConfidenceDetails, 
  determineRoute, 
  determineAction, 
  INTENT_OPTIONS, 
  CLARITY_OPTIONS 
} from '../../services/scoringEngine';
import { IntentBadge, RouteBadge, ActionBadge, ClarityBadge } from './Badge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { 
  X, 
  Sparkles, 
  Play, 
  FileText, 
  Check, 
  HelpCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Sliders,
  Send
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    label: 'Job Application (Complete + CV)',
    sender: 'alex.morgan@example.com',
    sender_name: 'Alex Morgan',
    subject: 'Application for Senior Python Backend Engineer',
    body: 'Hi Hiring Team,\n\nI am writing to apply for the Senior Python Backend Engineer position at your company. Please find attached my resume and portfolio link.\n\nI have over 6 years of experience building distributed systems in Python and FastAPI.\n\nBest regards,\nAlex Morgan',
    intent_type: 'job_application',
    clarity_level: 'high',
    missing_information: false,
    needs_human_review: false,
    attachment: 'Resume_Alex_Morgan.pdf',
    reason: 'Direct application for Senior Python role with complete resume and clear contact info.',
  },
  {
    label: 'Interview Scheduling (High Clarity)',
    sender: 'sara.connor@example.com',
    sender_name: 'Sara Connor',
    subject: 'Re: Technical Interview Scheduling - Sara Connor',
    body: 'Hello HR Team,\n\nI received your invitation for the round 2 technical interview. I am available this Thursday and Friday between 2 PM and 5 PM EST.\n\nPlease let me know if any of those slots work for the panel.\n\nThanks,\nSara Connor',
    intent_type: 'interview_request',
    clarity_level: 'high',
    missing_information: false,
    needs_human_review: false,
    attachment: null,
    reason: 'Candidate provided specific availability slots for interview scheduling.',
  },
  {
    label: 'Clarification / Inquiry (Missing Info)',
    sender: 'jordan.lee@example.com',
    sender_name: 'Jordan Lee',
    subject: 'Job Inquiry',
    body: 'Hey there,\n\nI am interested in working with you guys in engineering. Do you have any open positions available?\n\nThanks,\nJordan',
    intent_type: 'clarification',
    clarity_level: 'low',
    missing_information: true,
    needs_human_review: true,
    attachment: null,
    reason: 'Vague inquiry without specified position title or resume.',
  },
  {
    label: 'Salary Dispute (Human Escalation)',
    sender: 'david.k@example.com',
    sender_name: 'David K',
    subject: 'Urgent: Salary negotiation and contract dispute',
    body: 'Dear HR Director,\n\nI am reviewing the offer letter sent yesterday. The compensation package does not match what was discussed verbally during the final interview. I require an immediate revision of clause 4 and a salary bump to $160,000 before I can sign.\n\nRegards,\nDavid K',
    intent_type: 'clarification',
    clarity_level: 'medium',
    missing_information: false,
    needs_human_review: true,
    attachment: 'Offer_Clause_Revision.docx',
    reason: 'Compensation and offer clause modification requiring manual HR attention.',
  },
  {
    label: 'Spam / Promo (Irrelevant)',
    sender: 'promo@marketing-blast.xyz',
    sender_name: 'Sales Team',
    subject: 'Boost your website traffic by 500% with our SEO tools!',
    body: 'Hi HR Manager,\n\nAre you looking to scale your website traffic fast? We provide affordable SEO and backlink packages starting at only $99/mo.\n\nUnsubscribe from this list.',
    intent_type: 'irrelevant',
    clarity_level: 'medium',
    missing_information: true,
    needs_human_review: true,
    attachment: null,
    reason: 'Spam advertisement unrelated to HR recruitment operations.',
  }
];

export function TestEmailModal() {
  const { isTestModalOpen, setIsTestModalOpen, processEmail } = useApp();

  const [form, setForm] = useState({
    sender: PRESET_TEMPLATES[0].sender,
    sender_name: PRESET_TEMPLATES[0].sender_name,
    subject: PRESET_TEMPLATES[0].subject,
    body: PRESET_TEMPLATES[0].body,
    intent_type: PRESET_TEMPLATES[0].intent_type,
    clarity_level: PRESET_TEMPLATES[0].clarity_level,
    missing_information: PRESET_TEMPLATES[0].missing_information,
    needs_human_review: PRESET_TEMPLATES[0].needs_human_review,
    attachment: PRESET_TEMPLATES[0].attachment,
    reason: PRESET_TEMPLATES[0].reason,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isTestModalOpen) return null;

  // Real-time deterministic calculation
  const scoreDetails = calculateConfidenceDetails({
    intent_type: form.intent_type,
    clarity_level: form.clarity_level,
    missing_information: form.missing_information,
    needs_human_review: form.needs_human_review,
  });

  const predictedRoute = determineRoute(scoreDetails.confidence);
  const predictedAction = determineAction(predictedRoute, form.intent_type);

  const applyPreset = (preset) => {
    setForm({
      sender: preset.sender,
      sender_name: preset.sender_name,
      subject: preset.subject,
      body: preset.body,
      intent_type: preset.intent_type,
      clarity_level: preset.clarity_level,
      missing_information: preset.missing_information,
      needs_human_review: preset.needs_human_review,
      attachment: preset.attachment,
      reason: preset.reason,
    });
  };

  const handleSimulate = async () => {
    setIsProcessing(true);
    try {
      await processEmail({
        ...form,
      });
      setIsTestModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b101d] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">Live AI Engine Simulator</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">Deterministic Math Engine</span>
              </div>
              <h2 className="text-base font-bold text-slate-100">Test Email Ingestion & Routing</h2>
            </div>
          </div>
          <button
            onClick={() => setIsTestModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Presets:
          </span>
          <div className="flex items-center gap-2">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Email Fields & AI Qualitative Extraction */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sender Email</label>
                  <input
                    type="email"
                    value={form.sender}
                    onChange={(e) => setForm({ ...form, sender: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                    placeholder="candidate@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={form.sender_name}
                    onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-medium"
                  placeholder="Subject Line"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Body Text</label>
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs leading-relaxed font-sans"
                  placeholder="Paste email body..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Attachment (optional)</label>
                <input
                  type="text"
                  value={form.attachment || ''}
                  onChange={(e) => setForm({ ...form, attachment: e.target.value || null })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  placeholder="e.g. Resume_Candidate.pdf"
                />
              </div>
            </div>

            {/* AI Qualitative Assessment Controls */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> LLM Qualitative Classification (Gemini)
                </span>
                <span className="text-[11px] text-slate-400">Strict Structured Output</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">intent_type</label>
                  <select
                    value={form.intent_type}
                    onChange={(e) => setForm({ ...form, intent_type: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  >
                    {INTENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label} ({opt.weight})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">clarity_level</label>
                  <select
                    value={form.clarity_level}
                    onChange={(e) => setForm({ ...form, clarity_level: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  >
                    {CLARITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label} ({opt.weight})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boolean Signals */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.missing_information}
                    onChange={(e) => setForm({ ...form, missing_information: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">missing_information</span>
                    <span className="text-[11px] text-slate-500">True = -0.20 penalty</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.needs_human_review}
                    onChange={(e) => setForm({ ...form, needs_human_review: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">needs_human_review</span>
                    <span className="text-[11px] text-slate-500">True = -0.30 penalty</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Classification Reason</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 rounded-xl text-xs text-slate-300"
                  placeholder="Factual classification justification..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Deterministic Scoring Matrix & Routing Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Deterministic Math Calculation
                </span>
                <span className="font-mono text-xs text-indigo-400">Fixed Rules</span>
              </div>

              {/* Formula Breakdown Table */}
              <div className="space-y-1.5 text-xs font-mono">
                {scoreDetails.breakdowns.map((step, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400 text-[11px] truncate max-w-[170px]">{step.factor}:</span>
                    <div className="flex items-center gap-2">
                      <span className={step.delta > 0 ? 'text-emerald-400' : step.delta < 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {step.delta > 0 ? `+${step.delta.toFixed(2)}` : step.delta.toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-[10px]">=&gt; {step.runningTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confidence Visualizer */}
              <div className="pt-2">
                <ConfidenceMeter value={scoreDetails.confidence} />
              </div>
            </div>

            {/* Predicted Route & Action Box */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pipeline Prediction Result
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Routing Decision:</span>
                  <RouteBadge route={predictedRoute} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Concrete Action:</span>
                  <ActionBadge action={predictedAction} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                {predictedRoute === 'auto_reply' && (
                  <span className="text-emerald-300">
                    Confidence ≥ 0.75: System will render acknowledgement/interview template and dispatch reply immediately.
                  </span>
                )}
                {predictedRoute === 'clarification' && (
                  <span className="text-amber-300">
                    Confidence 0.45 – 0.74: System requests missing candidate details or clarified position before routing further.
                  </span>
                )}
                {predictedRoute === 'human_review' && (
                  <span className="text-rose-300">
                    Confidence &lt; 0.45: Escalated directly to HR inbox (<span className="font-mono text-slate-200">hr@example.com</span>) with full audit trail.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSimulate}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Ingestion...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Process & Ingest Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
