import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  const getLoginErrorMessage = (err) => {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        if (err.code === 'ECONNABORTED') {
          return 'Tempo de resposta excedido. Tente novamente em instantes.';
        }

        return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
      }

      const backendError = err.response.data?.error;

      if (backendError) {
        const tentativasRestantes = err.response.data?.tentativas_restantes;

        if (typeof tentativasRestantes === 'number' && tentativasRestantes >= 0) {
          return `${backendError} Tentativas restantes: ${tentativasRestantes}.`;
        }

        return backendError;
      }

      if (err.response.status === 429) {
        return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
      }
    }

    return 'Erro inesperado ao fazer login. Tente novamente.';
  };

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
      const message = getLoginErrorMessage(err);
      setError(message);
      toast.error(message);
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
          id="login-email"
          fullWidth
          label="E-mail"
          name="email"
          type="text"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          helperText="Use o e-mail cadastrado para a sua conta"
          autoComplete="username"
          autoFocus
        />
        <TextField
          id="login-senha"
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
