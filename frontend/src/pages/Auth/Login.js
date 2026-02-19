import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;

      setAuth(user, token);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (err) {
      const normalizedEmail = (formData.email || '').trim().toLowerCase();
      const normalizedPassword = (formData.senha || '').trim();
      const backendError = err.response?.data?.error || 'Erro ao fazer login';

      if (normalizedEmail === 'admin' && normalizedPassword === 'admin') {
        setError('Use e-mail no login. Acesso padrão: admin@chamados-ti.com / admin');
      } else {
        setError(backendError);
      }
      toast.error('Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" align="center" gutterBottom>
        Chamados TI
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" mb={3}>
        Faça login para continuar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="E-mail"
          name="email"
          type="text"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          helperText="Ex.: admin@chamados-ti.com"
          autoComplete="username"
          autoFocus
        />
        <TextField
          fullWidth
          label="Senha"
          name="senha"
          type="password"
          value={formData.senha}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="current-password"
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Entrar'}
        </Button>
      </form>
    </Box>
  );
}

export default Login;
