import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Home/Dashboard';
import MeusChamados from './pages/Home/MeusChamados';
import ListarChamados from './pages/Ocorrencias/ListarChamados';
import AbrirChamado from './pages/Ocorrencias/AbrirChamado';
import DetalhesChamado from './pages/Ocorrencias/DetalhesChamado';
import ListarAtivos from './pages/Inventario/ListarAtivos';
import DetalhesAtivo from './pages/Inventario/DetalhesAtivo';
import ListarClientes from './pages/Clientes/ListarClientes';
import Configuracoes from './pages/Admin/Configuracoes';

// Store
import { useAuthStore } from './store/authStore';
import api from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthBootstrap = () => {
  const { isAuthenticated, token, logout, updateUser } = useAuthStore();

  React.useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      if (!isAuthenticated || !token) {
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted && response?.data?.user) {
          updateUser(response.data.user);
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 && isMounted) {
          logout();
        }
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token, logout, updateUser]);

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthBootstrap />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Rotas públicas */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Rotas protegidas */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Home */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/home/dashboard" element={<Dashboard />} />
              <Route path="/home/meus-chamados" element={<MeusChamados />} />

              {/* Ocorrências */}
              <Route path="/ocorrencias" element={<ListarChamados />} />
              <Route path="/ocorrencias/abrir" element={<AbrirChamado />} />
              <Route path="/ocorrencias/:id" element={<DetalhesChamado />} />

              {/* Inventário */}
              <Route path="/inventario" element={<ListarAtivos />} />
              <Route path="/inventario/:id" element={<DetalhesAtivo />} />

              {/* Clientes */}
              <Route path="/clientes" element={<ListarClientes />} />

              {/* Admin */}
              <Route path="/admin/configuracoes" element={<Configuracoes />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Analytics />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
