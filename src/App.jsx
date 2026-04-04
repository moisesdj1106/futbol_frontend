import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Players from './pages/Players';
import Versus from './pages/Versus';
import Lineup from './pages/Lineup';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageUsers from './pages/admin/ManageUsers';
import Match from './pages/Match';
import Teams from './pages/Teams';
import LiveMatches from './pages/LiveMatches';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/players" />;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/players" element={<PrivateRoute><Players /></PrivateRoute>} />
        <Route path="/versus" element={<PrivateRoute><Versus /></PrivateRoute>} />
        <Route path="/lineup" element={<PrivateRoute><Lineup /></PrivateRoute>} />
        <Route path="/match" element={<PrivateRoute><Match /></PrivateRoute>} />
        <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
        <Route path="/live" element={<PrivateRoute><LiveMatches /></PrivateRoute>} />
        <Route path="/admin/players" element={<PrivateRoute><AdminRoute><ManagePlayers /></AdminRoute></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><AdminRoute><ManageUsers /></AdminRoute></PrivateRoute>} />
        <Route path="*" element={<Navigate to={token ? '/players' : '/login'} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
