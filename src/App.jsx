import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Holdings from './pages/Holdings';
import Calendar from './pages/Calendar';
import Connections from './pages/Connections';
import AIInsights from './pages/AIInsights';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="income" element={<Income />} />
          <Route path="holdings" element={<Holdings />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="connections" element={<Connections />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
