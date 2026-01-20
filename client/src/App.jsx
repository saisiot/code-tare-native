import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import TagManagement from './pages/TagManagement';
import ReadmePage from './pages/ReadmePage';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tags" element={<TagManagement />} />
        <Route path="/readme" element={<ReadmePage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;
