import React, { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { isValidEmail } from '../utils/validation';
import { ExosIllustration, ExosHalo, ExosIcon } from './shared/ExosIcon';

/* ─── ServiceLink logo ───────────────────────────────────────────── */
const Logo = ({ inverted = false }) => (
  <img
    src={inverted ? '/servicelink-logo-white.svg' : '/servicelink-logo.svg'}
    alt="ServiceLink"
    height={36}
    className="h-9 w-auto object-contain"
  />
);

const INTEREST_OPTIONS = [
  { value: 'abstractor',    label: 'Abstractor' },
  { value: 'appraiser',     label: 'Appraiser' },
  { value: 'notary',        label: 'Notary or signing agent' },
  { value: 'real_estate',   label: 'Real estate agent' },
  { value: 'trustee',       label: 'Trustee or foreclosure attorney' },
  { value: 'field_services',label: 'Property preservation contractor or field services inspector' },
];

/* ─── Shared CTA button ──────────────────────────────────────────── */
const PrimaryBtn = ({ children, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-exos transition-colors text-sm ${className}`}
  >
    {children}
  </button>
);

const OutlineBtn = ({ children, onClick, dark = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 border-2 font-semibold px-6 py-3 rounded-exos transition-colors text-sm
      ${dark
        ? 'border-white/40 text-white hover:bg-white/10'
        : 'border-blue-600 text-blue-600 hover:bg-blue-50'
      }`}
  >
    {children}
  </button>
);

/* ─── Image placeholder ──────────────────────────────────────────── */
const ImgBlock = ({ gradient, className = '', children }) => (
  <div className={`rounded-exos overflow-hidden ${gradient} ${className}`}>
    {children}
  </div>
);

/* ─── Main component ─────────────────────────────────────────────── */
const MarketingPage = ({ state, setState, onNext, onDevSkip }) => {
  const [formData, setFormData] = useState({
    name: state.marketingData.name || '',
    email: state.marketingData.email || '',
    interest: state.marketingData.interest || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(formData.email)) e.email = 'Enter a valid email address';
    if (!formData.interest) e.interest = 'Please select a service type';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setState((prev) => ({
      ...prev,
      marketingData: formData,
      accountData: { ...prev.accountData, email: formData.email },
    }));
    onNext();
  };

  const inputCls = (hasError) =>
    `w-full border rounded-exos py-3 px-4 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm
    ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-300'}`;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <a href="#partner-form" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Already a vendor? Sign in
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5 tracking-tight text-white">
              Level up your business<br />
              <span className="text-blue-300">by partnering with ServiceLink</span>
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed mb-8 max-w-lg">
              Join the nation's leading network of real estate service vendors and
              connect with high-volume clients in your area.
            </p>
            <div className="flex flex-wrap gap-3">
              <PrimaryBtn onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}>
                Join our panel <ArrowRight className="w-4 h-4" />
              </PrimaryBtn>
              <OutlineBtn dark onClick={() => {}}>
                Already a vendor?
              </OutlineBtn>
            </div>
          </div>

          {/* Right — EXOS illustration */}
          <div className="hidden lg:flex justify-center">
            <ExosHalo size={320}>
              <ExosIllustration name="house-search" size={200} />
            </ExosHalo>
          </div>
        </div>
      </section>

      {/* ── FEATURES BAR ─────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-10">
            Future proof your appraisal business by joining our panel
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'check-circle-fill', bg: 'bg-emerald-50', title: 'Instant verification', body: 'Real-time license check via ASC.gov so you start faster.' },
              { icon: 'document-fill', bg: 'bg-blue-50', title: 'Digital process', body: 'No printing, no mailing. Everything is handled online.' },
              { icon: 'home-fill', bg: 'bg-slate-100', title: 'High-volume orders', body: 'Access thousands of assignments across your service area.' },
              { icon: 'dollar-circle-fill', bg: 'bg-amber-50', title: 'Fast payment', body: 'Net-30 payments direct to your account on completed jobs.' },
            ].map(({ icon, bg, title, body }, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 ${bg} rounded-exos flex items-center justify-center mx-auto mb-4`}>
                  <ExosIcon name={icon} size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROKER PANEL ─────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="h-72 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-exos">
            <ExosHalo size={220}>
              <ExosIllustration name="house-stamp" size={130} />
            </ExosHalo>
          </div>
          <div>
            <p className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-2">Appraisers</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Join our broker panel</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Partnering with ServiceLink connects you to one of the highest-volume appraisal
              management platforms in the country. Submit your credentials once — we handle
              assignment routing, scheduling, and payment.
            </p>
            <ul className="space-y-2 mb-7">
              {['Residential & commercial assignments', 'USPAP-compliant workflow', 'Dedicated vendor support team'].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-slate-700 text-sm">
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}>
              Apply now <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </div>
        </div>
      </section>

      {/* ── SIGNING AGENTS ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 text-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-300 font-semibold text-xs uppercase tracking-widest mb-2">Notaries &amp; Signing Agents</p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-white">
              Join the nation's most powerful network of signing agents
            </h2>
            <p className="text-blue-100/75 leading-relaxed mb-6">
              ServiceLink processes millions of closings annually. As a signing agent in our
              network you'll have access to consistent work, competitive fees, and a seamless
              digital assignment platform.
            </p>
            <ul className="space-y-2 mb-7">
              {['Consistent closing assignments', 'Mobile-friendly scheduling', 'Same-day assignment notifications'].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-blue-100/80 text-sm">
                  <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}>
              Join the network <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </div>
          <div className="h-72 hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-900/60 to-slate-800/80 rounded-exos">
            <ExosHalo size={220}>
              <ExosIllustration name="mail-open-instant" size={130} />
            </ExosHalo>
          </div>
        </div>
      </section>

      {/* ── ABSTRACTORS ──────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="h-72 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 rounded-exos order-2 lg:order-1">
            <ExosHalo size={220}>
              <ExosIllustration name="house-map-pin" size={130} />
            </ExosHalo>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-2">Abstractors</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
              We're expanding our network of highly skilled title abstractors
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Join a growing roster of title abstractors providing chain-of-title searches,
              lien checks, and property research for one of the largest title networks in the U.S.
            </p>
            <ul className="space-y-2 mb-7">
              {['Nationwide coverage opportunities', 'Clear turnaround time standards', 'Competitive per-search fees'].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-slate-700 text-sm">
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}>
              Apply now <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </div>
        </div>
      </section>

      {/* ── FIELD SERVICES ───────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-2">Field Services</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
              Join our national field services and property preservation network
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              From lawn care and winterizations to inspections and repairs, ServiceLink connects
              field service vendors with steady, year-round work across every U.S. market.
            </p>
            <ul className="space-y-2 mb-7">
              {['Inspections, repairs &amp; preservation', 'Year-round assignment volume', 'Photo-documented work orders'].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-slate-700 text-sm">
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}>
              Get started <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </div>
          <div className="h-72 hidden lg:flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 rounded-exos">
            <ExosHalo size={220}>
              <ExosIllustration name="house-pin-2" size={130} />
            </ExosHalo>
          </div>
        </div>
      </section>

      {/* ── ALREADY A VENDOR ─────────────────────────────────────── */}
      <section className="bg-white py-14 border-t border-slate-100">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-exos p-6">
            <div className="flex justify-center mb-4">
              <ExosIllustration name="medal" size={56} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Already a vendor partner?</h3>
            <p className="text-slate-500 text-sm mb-5">Sign in to your existing ServiceLink vendor portal account.</p>
            <OutlineBtn onClick={() => {}}>
              Sign in to your account <ArrowRight className="w-4 h-4" />
            </OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── FORM SECTION ─────────────────────────────────────────── */}
      <section id="partner-form" className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — copy */}
          <div className="text-white">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight text-white">
              We're ready to<br />partner with you.
            </h2>
            <p className="text-blue-100/75 text-lg leading-relaxed max-w-md">
              Get onboarded in minutes. Access thousands of assignments and start earning
              faster with our streamlined, fully digital process.
            </p>
          </div>

          {/* Right — form card */}
          <div>
            <div className="bg-white rounded-exos shadow-2xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Start your application</h3>
              <p className="text-slate-500 text-sm mb-6">Takes about 10 minutes to complete.</p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className={inputCls(errors.name)}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jane@example.com"
                    className={inputCls(errors.email)}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                </div>

                {/* I'm interested in */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">I'm interested in</label>
                  <select
                    value={formData.interest}
                    onChange={(e) => setFormData((p) => ({ ...p, interest: e.target.value }))}
                    className={inputCls(errors.interest) + ' appearance-none cursor-pointer'}
                  >
                    <option value="">Select a service type...</option>
                    {INTEREST_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.interest && <p className="text-red-500 text-xs mt-1.5">{errors.interest}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-exos transition-colors flex items-center justify-center gap-2 mt-2 text-sm"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-5">
                By continuing you agree to ServiceLink's{' '}
                <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and{' '}
                <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo inverted />
          <p className="text-xs text-center md:text-right">
            © {new Date().getFullYear()} ServiceLink Field Services, LLC.{' '}
            <button
              type="button"
              onClick={onDevSkip}
              className="hover:text-slate-300 transition-colors"
            >
              All rights reserved.
            </button>
          </p>
        </div>
      </footer>

    </div>
  );
};

export default MarketingPage;
