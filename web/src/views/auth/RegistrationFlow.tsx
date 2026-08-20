import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, UploadCloud, X, Loader2, Search, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCountryCodes, CountryCode } from '../../hooks/useCountryCodes';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateBusinessDetails,
} from '../../validation';

interface RegistrationFlowProps {
  onClose: () => void;
}

export default function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const { register } = useAuth();
  const { countries, selectedDialCode, setSelectedDialCode, isLoading: isCountriesLoading } = useCountryCodes();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Country Picker Dropdown State
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [role, setRole] = useState<'shipper' | 'transporter' | 'forwarder' | 'customs' | 'admin' | null>(null);
  const [localPhone, setLocalPhone] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    taxId: '',
    licenseNumber: '',
  });

  // Validation State & Functions
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);

  const fullNameValidation = validateFullName(formData.fullName);
  const emailValidation = validateEmail(formData.email);
  const phoneValidation = validatePhone(localPhone);
  const passwordValidation = validatePassword(formData.password);
  const isStep1Valid = fullNameValidation.isValid && emailValidation.isValid && phoneValidation.isValid && passwordValidation.isValid;

  const businessValidation = validateBusinessDetails(role, formData);

  // Active selected country
  const activeCountry = countries.find((c) => c.dial_code === selectedDialCode) || countries[0];
  const totalSteps = role === 'transporter' ? 3 : 2;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep phone formatted whenever dial code changes
  useEffect(() => {
    if (localPhone.trim()) {
      setFormData((prev) => ({
        ...prev,
        phone: `${selectedDialCode} ${localPhone.trim()}`,
      }));
    }
  }, [selectedDialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSelectCountry = (country: CountryCode) => {
    setSelectedDialCode(country.dial_code);
    setFormData((prev) => ({
      ...prev,
      phone: localPhone.trim() ? `${country.dial_code} ${localPhone.trim()}` : '',
    }));
    setIsCountryDropdownOpen(false);
    setCountrySearchQuery('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9\s-]/g, '');
    setLocalPhone(rawVal);
    setFormData((prev) => ({
      ...prev,
      phone: rawVal.trim() ? `${selectedDialCode} ${rawVal.trim()}` : '',
    }));
  };

  const handleNextStep1 = () => {
    setStep1Attempted(true);
    if (!isStep1Valid) {
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep2Attempted(true);
    if (!businessValidation.isValid) {
      const firstError = Object.values(businessValidation.errors)[0];
      if (firstError) setError(firstError);
      return;
    }
    setStep(3);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setStep2Attempted(true);

    if (!businessValidation.isValid) {
      const firstError = Object.values(businessValidation.errors)[0];
      if (firstError) setError(firstError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      let mappedRole = 'SHIPPER';
      if (role === 'transporter') mappedRole = 'TRANSPORTER';
      if (role === 'forwarder') mappedRole = 'FORWARDER';
      if (role === 'customs') mappedRole = 'CUSTOMS_OFFICER';
      if (role === 'admin') mappedRole = 'ADMIN';

      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: mappedRole,
        companyName: ['customs', 'admin'].includes(role as string) ? undefined : formData.companyName,
        tinNumber: ['customs', 'admin'].includes(role as string) ? undefined : formData.taxId,
        tradeLicense: ['customs', 'admin'].includes(role as string) ? undefined : formData.licenseNumber,
        badgeId: role === 'customs' ? formData.taxId : undefined,
      });

      setStep(role === 'transporter' ? 4 : 3); // Success step
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered countries for search
  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
      c.dial_code.includes(countrySearchQuery) ||
      c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const renderStep1 = () => {
    const showFullNameError = (touched.fullName || step1Attempted) && !fullNameValidation.isValid;
    const showEmailError = (touched.email || step1Attempted) && !emailValidation.isValid;
    const showPhoneError = (touched.phone || step1Attempted) && !phoneValidation.isValid;
    const showPasswordError = (touched.password || step1Attempted) && !passwordValidation.isValid;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Account Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">Enter your basic personal and login information.</p>
        </div>
        
        <div className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              onBlur={() => handleBlur('fullName')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                showFullNameError 
                  ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                  : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
              }`}
              placeholder="John Doe" 
            />
            {showFullNameError && (
              <p className="text-[11px] text-red-600 mt-1">Please enter your full name (at least 2 characters).</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              onBlur={() => handleBlur('email')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                showEmailError 
                  ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                  : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
              }`}
              placeholder="you@company.com" 
            />
            {showEmailError && (
              <p className="text-[11px] text-red-600 mt-1">Please enter a valid email address.</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
            <div 
              className={`relative flex rounded-md border focus-within:ring-1 transition-colors ${
                showPhoneError 
                  ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500' 
                  : 'border-slate-300 focus-within:ring-slate-900 focus-within:border-slate-900'
              }`} 
              ref={countryDropdownRef}
            >
              {/* Country Selector Trigger */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                className="bg-slate-50 border-r border-slate-300 px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:bg-slate-100 flex items-center gap-1.5 rounded-l-md shrink-0 transition-colors"
              >
                {activeCountry?.flagUrl ? (
                  <img 
                    src={activeCountry.flagUrl} 
                    alt={activeCountry.name} 
                    className="w-4 h-3 object-cover rounded-xs border border-slate-300" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-xs">{activeCountry?.flag || '🌐'}</span>
                )}
                <span className="font-mono text-xs text-slate-800 font-medium">{activeCountry?.dial_code || selectedDialCode}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Country Dropdown Popover */}
              {isCountryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1.5">
                  <div className="relative mb-1.5">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      placeholder="Search country..."
                      className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:border-slate-400 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-0.5">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <button
                          key={`${c.code}-${c.dial_code}`}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-slate-100 transition-colors ${
                            c.dial_code === selectedDialCode ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {c.flagUrl ? (
                              <img 
                                src={c.flagUrl} 
                                alt={c.name} 
                                className="w-4 h-3 object-cover rounded-xs border border-slate-300 shrink-0" 
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span className="shrink-0 text-xs">{c.flag}</span>
                            )}
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">{c.dial_code}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-center text-xs text-slate-400">No results</div>
                    )}
                  </div>
                </div>
              )}

              {/* Local Phone Input */}
              <input 
                type="tel" 
                value={localPhone} 
                onChange={handlePhoneChange} 
                onBlur={() => handleBlur('phone')}
                className="w-full px-3 py-2 text-sm text-slate-900 outline-none bg-white placeholder:text-slate-400 rounded-r-md" 
                placeholder={activeCountry?.placeholder || '911 234 567'} 
              />
            </div>
            {showPhoneError && (
              <p className="text-[11px] text-red-600 mt-1">Please enter a valid phone number (at least 8 digits).</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                onBlur={() => handleBlur('password')}
                className={`w-full border rounded-md pl-3 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  showPasswordError 
                    ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
                }`}
                placeholder="Minimum 8 characters" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {showPasswordError && (
              <p className="text-[11px] text-red-600 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, number, and symbol.
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
          <button 
            type="button"
            onClick={onClose} 
            className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleNextStep1} 
            className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            Next: Business Info <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const showRoleError = step2Attempted && !role;
    const showCompanyError = step2Attempted && !['customs', 'admin'].includes(role as string) && !formData.companyName.trim();
    const showTaxIdError = step2Attempted && (!formData.taxId.trim());
    const showLicenseError = step2Attempted && !['customs', 'admin'].includes(role as string) && !formData.licenseNumber.trim();

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">Specify your organization role and regulatory credentials.</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Role</label>
            <select 
              value={role || ''} 
              onChange={(e) => { setRole(e.target.value as any); setError(null); }} 
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none transition-colors ${
                showRoleError 
                  ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                  : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
              }`}
              required
            >
              <option value="" disabled>Select your role...</option>
              <option value="shipper">Shipper / Importer</option>
              <option value="forwarder">Freight Forwarder</option>
              <option value="transporter">Transporter / Fleet Owner</option>
              <option value="customs">Customs Inspector</option>
              <option value="admin">System Administrator</option>
            </select>
            {showRoleError && <p className="text-[11px] text-red-600 mt-1">Please select an organization role.</p>}
          </div>

          {!['customs', 'admin'].includes(role as string) && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
              <input 
                type="text" 
                name="companyName" 
                value={formData.companyName} 
                onChange={handleChange} 
                onBlur={() => handleBlur('companyName')}
                className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  showCompanyError 
                    ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
                }`}
                placeholder="e.g. Abyssinia Transit PLC" 
              />
              {showCompanyError && <p className="text-[11px] text-red-600 mt-1">Company name is required.</p>}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {!['admin'].includes(role as string) && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{role === 'customs' ? 'Badge ID' : 'Tax ID (TIN)'}</label>
                <input 
                  type="text" 
                  name="taxId" 
                  value={formData.taxId} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur('taxId')}
                  className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    showTaxIdError 
                      ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
                  }`}
                  placeholder={role === 'customs' ? 'Badge Number' : '10 digit number'} 
                />
                {showTaxIdError && <p className="text-[11px] text-red-600 mt-1">{role === 'customs' ? 'Badge ID required.' : 'Tax ID (TIN) required.'}</p>}
              </div>
            )}
            {!['customs', 'admin'].includes(role as string) && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trade License No.</label>
                <input 
                  type="text" 
                  name="licenseNumber" 
                  value={formData.licenseNumber} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur('licenseNumber')}
                  className={`w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    showLicenseError 
                      ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900'
                  }`}
                  placeholder="MTI/..." 
                />
                {showLicenseError && <p className="text-[11px] text-red-600 mt-1">Trade license required.</p>}
              </div>
            )}
          </div>

          {!['customs', 'admin'].includes(role as string) && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Documents</label>
              <div className="border border-dashed border-slate-300 rounded-md p-4 text-center hover:border-slate-400 hover:bg-slate-50/60 transition-colors cursor-pointer">
                <UploadCloud size={20} className="mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs font-medium text-slate-700">Upload Trade License & TIN</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF or JPEG, max 5MB</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
          <button 
            type="button"
            onClick={handleBack} 
            disabled={isSubmitting} 
            className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          <button 
            type="button"
            onClick={role === 'transporter' ? handleNextStep2 : handleSubmit} 
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Submitting...
              </>
            ) : role === 'transporter' ? (
              <>
                Next: Fleet Details <ChevronRight size={14} />
              </>
            ) : (
              'Submit Registration'
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Fleet Declarations</h3>
        <p className="text-xs text-slate-500 mt-0.5">Declare vehicle capacity and transit licenses for fleet operations.</p>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Primary Vehicle Types</label>
          <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors">
            <option>Flatbed Trailer (40ft)</option>
            <option>Dry Van Box Truck</option>
            <option>Fuel Tanker</option>
            <option>Refrigerated Trailer</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Total Fleet Size</label>
            <input 
              type="number" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors" 
              placeholder="Number of trucks" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Insurance Policy No.</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors" 
              placeholder="Policy ID" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Roadworthiness Certificate</label>
          <div className="border border-dashed border-slate-300 rounded-md p-4 text-center hover:border-slate-400 hover:bg-slate-50/60 transition-colors cursor-pointer">
            <UploadCloud size={20} className="mx-auto text-slate-400 mb-1.5" />
            <p className="text-xs font-medium text-slate-700">Upload Libre / Inspection Certificate</p>
            <p className="text-[11px] text-slate-400 mt-0.5">PDF or JPEG, max 5MB</p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
        <button 
          type="button"
          onClick={handleBack} 
          disabled={isSubmitting} 
          className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button 
          type="button"
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Submitting...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-6">
      <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
        <CheckCircle2 size={20} className="text-slate-800" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">Registration Submitted</h3>
      <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
        Your TradeFlow account has been created. You can now access your portal workspace.
      </p>
      <button 
        type="button"
        onClick={onClose} 
        className="w-full px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 transition-colors"
      >
        Go to Portal
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Create Account</h2>
            {step <= totalSteps && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">Step {step} of {totalSteps}</p>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && role === 'transporter' && renderStep3()}
          {step === 3 && role !== 'transporter' && renderSuccess()}
          {step === 4 && renderSuccess()}
        </div>

      </div>
    </div>
  );
}
