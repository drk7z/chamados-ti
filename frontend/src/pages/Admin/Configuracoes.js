import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../../services/api';

const initialForm = {
  sistema_nome: '',
  sistema_versao: '',
  smtp_host: '',
  smtp_port: '',
  timezone: '',
};

function Configuracoes() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const { data, isLoading, isError } = useQuery(
    'admin-configuracoes',
    async () => {
      const response = await api.get('/admin/configuracoes');
      return response.data;
    }
  );

  useEffect(() => {
    if (!data) return;
    setForm({
      sistema_nome: data.sistema?.nome || '',
      sistema_versao: data.sistema?.versao || '',
      smtp_host: data.email?.smtp_host || '',
      smtp_port: data.email?.smtp_port != null ? String(data.email.smtp_port) : '',
      timezone: data.geral?.timezone || '',
    });
  }, [data]);

  const saveMutation = useMutation(
    async (fields) => {
      await Promise.all(
        fields.map(({ chave, valor, tipo, categoria }) =>
          api.put('/admin/configuracoes', { chave, valor, tipo, categoria, escopo: 'tenant' })
        )
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-configuracoes');
        toast.success('Configurações salvas com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar configurações');
      },
    }
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const fields = [
      { chave: 'sistema_nome', valor: form.sistema_nome, tipo: 'string', categoria: 'sistema' },
      { chave: 'sistema_versao', valor: form.sistema_versao, tipo: 'string', categoria: 'sistema' },
      { chave: 'smtp_host', valor: form.smtp_host, tipo: 'string', categoria: 'email' },
      { chave: 'smtp_port', valor: form.smtp_port, tipo: 'number', categoria: 'email' },
      { chave: 'timezone', valor: form.timezone, tipo: 'string', categoria: 'geral' },
    ].filter((f) => f.valor !== '' && f.valor != null);

    if (!fields.length) {
      toast.info('Nenhuma configuração para salvar');
      return;
    }

    saveMutation.mutate(fields);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Não foi possível carregar as configurações.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configurações do Sistema
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Sistema */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sistema
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id="config-sistema-nome"
                name="sistema_nome"
                fullWidth
                label="Nome do Sistema"
                value={form.sistema_nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="config-sistema-versao"
                name="sistema_versao"
                fullWidth
                label="Versão"
                value={form.sistema_versao}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* E-mail / SMTP */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            E-mail / SMTP
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                id="config-smtp-host"
                name="smtp_host"
                fullWidth
                label="Servidor SMTP (host)"
                placeholder="smtp.example.com"
                value={form.smtp_host}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="config-smtp-port"
                name="smtp_port"
                fullWidth
                label="Porta SMTP"
                type="number"
                placeholder="587"
                value={form.smtp_port}
                onChange={handleChange}
                inputProps={{ min: 1, max: 65535 }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Geral */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Geral
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id="config-timezone"
                name="timezone"
                fullWidth
                label="Fuso Horário (timezone)"
                placeholder="America/Sao_Paulo"
                value={form.timezone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="config-multiempresa"
                fullWidth
                label="Multi-empresa"
                value={data?.geral?.multiempresa ? 'Habilitado' : 'Desabilitado'}
                InputProps={{ readOnly: true }}
                helperText="Controlado via variável de ambiente MULTIEMPRESA"
              />
            </Grid>
          </Grid>
        </Paper>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saveMutation.isLoading}
          >
            {saveMutation.isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default Configuracoes;
