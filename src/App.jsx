import React, { useState } from 'react';
import Header from './components/shared/Header';
import MarketingPage from './components/MarketingPage';
import AccountCreation from './components/AccountCreation';
import BasicInfo from './components/BasicInfo';
import BusinessStructureSelection from './components/BusinessStructureSelection';
import W9SoleProp from './components/w9/W9SoleProp';
import W9SingleLLC from './components/w9/W9SingleLLC';
import W9MultiLLC from './components/w9/W9MultiLLC';
import W9Partnership from './components/w9/W9Partnership';
import W9Corporation from './components/w9/W9Corporation';
import W9Trust from './components/w9/W9Trust';
import W9Other from './components/w9/W9Other';
import W9ReviewSign from './components/W9ReviewSign';
import LicenseUpload from './components/LicenseUpload';
import EOInsuranceUpload from './components/EOInsuranceUpload';
import BackgroundCheck from './components/BackgroundCheck';
import TVAAgreement from './components/TVAAgreement';
import SubmissionConfirmation from './components/SubmissionConfirmation';
import SetupMapFlow from './components/setup/SetupMapFlow';
import QuickSetup from './components/setup/QuickSetup';

const initialState = {
  currentStep: 1,
  totalSteps: 7,
  marketingData: { name: '', email: '', interest: '' },
  accountData: { email: '', password: '', authMethod: 'email' },
  basicInfo: {
    firstName: '',
    lastName: '',
    phone: '',
    address: { street: '', city: '', state: '', zip: '', validated: false },
  },
  businessStructure: null,
  w9Data: {
    businessName: '',
    taxClassification: '',
    foreignMembers: null,
    taxId: '',
    taxIdType: '',
    mailingAddress: { useOfficeAddress: true, street: '', city: '', state: '', zip: '' },
  },
  w9Signature: { signatureData: null, signedAt: null },
  license: {
    uploadedFile: null,
    ocrData: { state: '', type: '', number: '', effectiveDate: '', expirationDate: '', address: '' },
    apiVerified: false,
    apiError: null,
  },
  eoInsurance: { uploadedFile: null },
  tva: { agreed: false, agreedAt: null },
  setup: null,
  ui: { errors: {}, loading: false, apiCallInProgress: false },
};

// Screen → progress step mapping (6 steps)
// Step 1: Basic Info (screen 3)
// Step 2: W-9 — Business Type + W-9 Info + W-9 Review (screens 4-6)
// Step 3: License (screen 7)
// Step 4: Insurance (screen 8)
// Step 5: Background Check (screen 9)
// Step 6: Agreement (screen 10)
const getProgressStep = (screen) => {
  if (screen === 3) return 1;
  if (screen >= 4 && screen <= 6) return 2;
  if (screen === 7) return 3;
  if (screen === 8) return 4;
  if (screen === 9) return 5;
  if (screen === 10) return 6;
  return null;
};

// Step → screen (navigates to start of each step)
const STEP_TO_SCREEN = [null, 3, 4, 7, 8, 9, 10];

const App = () => {
  const [state, setState] = useState(initialState);
  const [screen, setScreen] = useState(1);

  const navigateNext = () => setScreen((prev) => prev + 1);
  const navigateBack = () => setScreen((prev) => prev - 1);
  const navigateToStep = (step) => setScreen(STEP_TO_SCREEN[step] ?? screen);

  // Dev shortcut: skip to setup with ZIP 75009 pre-filled
  const devSkipToSetup = () => {
    setState((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        address: { street: '123 Main St', city: 'Celina', state: 'TX', zip: '75009', validated: true },
      },
    }));
    setScreen(12);
  };

  const progressStep = getProgressStep(screen);
  const showHeader = screen >= 2 && screen <= 10;

  const renderScreen = () => {
    const props = { state, setState, onNext: navigateNext, onBack: navigateBack };

    switch (screen) {
      case 1:
        return <MarketingPage {...props} onDevSkip={devSkipToSetup} />;
      case 2:
        return <AccountCreation {...props} />;
      case 3:
        return <BasicInfo {...props} />;
      case 4:
        return <BusinessStructureSelection {...props} />;
      case 5: {
        switch (state.businessStructure) {
          case 'sole_prop':   return <W9SoleProp {...props} />;
          case 'single_llc':  return <W9SingleLLC {...props} />;
          case 'multi_llc':   return <W9MultiLLC {...props} />;
          case 'partnership': return <W9Partnership {...props} />;
          case 'corporation': return <W9Corporation {...props} />;
          case 'trust':       return <W9Trust {...props} />;
          case 'other':       return <W9Other {...props} />;
          default:            return null;
        }
      }
      case 6:  return <W9ReviewSign {...props} />;
      case 7:  return <LicenseUpload {...props} />;
      case 8:  return <EOInsuranceUpload {...props} />;
      case 9:  return <BackgroundCheck state={state} onNext={navigateNext} onBack={navigateBack} />;
      case 10: return <TVAAgreement {...props} />;
      case 11: return <SubmissionConfirmation state={state} onSetupClick={() => setScreen(12)} />;
      case 12: return <SetupMapFlow state={state} setState={setState} onQuick={() => setScreen(13)} onBack={() => setScreen(11)} onDone={() => setScreen(11)} />;
      case 13: return <QuickSetup state={state} setState={setState} onBack={() => setScreen(12)} onDone={() => setScreen(11)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showHeader && <Header progressStep={progressStep} screen={screen} onStepClick={navigateToStep} />}
      <main>{renderScreen()}</main>
    </div>
  );
};

export default App;
