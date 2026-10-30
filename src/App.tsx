import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import TimeMachine from './components/TimeMachine';
import DemoGuide from './components/DemoGuide';
import Dashboard from './pages/Dashboard';
import AllInstruments from './pages/AllInstruments';
import VerificationQueue from './pages/VerificationQueue';
import InstrumentReview from './pages/InstrumentReview';
import InstitutionPortal from './pages/InstitutionPortal';
import BankConfirmation from './pages/BankConfirmation';
import MaturityRadar from './pages/MaturityRadar';
import ReleaseRequests from './pages/ReleaseRequests';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Sidebar />
      <TimeMachine />
      <DemoGuide />
      <main className="ml-56 mt-14 min-h-screen p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/institution" element={<InstitutionPortal />} />
          <Route path="/instruments" element={<AllInstruments />} />
          <Route path="/instruments/:id" element={<InstrumentReview />} />
          <Route path="/queue" element={<VerificationQueue />} />
          <Route path="/bank/:token" element={<BankConfirmation />} />
          <Route path="/radar" element={<MaturityRadar />} />
          <Route path="/releases" element={<ReleaseRequests />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
