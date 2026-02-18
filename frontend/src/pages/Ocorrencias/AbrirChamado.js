import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { normalizePtBrText } from '../../utils/text';
import { selectA11yProps } from '../../utils/selectAccessibility';

function AbrirChamado() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    titulo: '',
    descricao: '',
    tipo_id: '',
    prioridade_id: '',
    status_id: '',
  });

  const [formError, setFormError] = React.useState('');

  const { data: tipos = [], isLoading: loadingTipos } = useQuery('ocorrencias-tipos', async () => {
    const response = await api.get('/ocorrencias/config/tipos');
    return response.data;
  });

  const { data: prioridades = [], isLoading: loadingPrioridades } = useQuery('ocorrencias-prioridades', async () => {
    const response = await api.get('/ocorrencias/config/prioridades');
    return response.data;
  });

  const { data: statusList = [], isLoading: loadingStatus } = useQuery('ocorrencias-status', async () => {
    const response = await api.get('/ocorrencias/config/status');
    return response.data;
  });

  React.useEffect(() => {
    if (!form.status_id && statusList.length > 0) {
      const aberto = statusList.find((item) => item.tipo === 'aberto');
      if (aberto?.id) {
        setForm((prev) => ({ ...prev, status_id: aberto.id }));
      }
    }
  }, [statusList, form.status_id]);

  const createMutation = useMutation(
    async (payload) => {
      const response = await api.post('/ocorrencias', payload);
      return response.data;
    },
    {
      onSuccess: (created) => {
        toast.success('Chamado aberto com sucesso!');
        navigate(`/ocorrencias/${created.id}`);
      },
      onError: (err) => {
        const message = err?.response?.data?.error || 'Não foi possível abrir o chamado';
        setFormError(message);
        toast.error('Falha ao abrir chamado');
      },
    }
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.titulo.trim() || !form.descricao.trim() || !form.tipo_id || !form.prioridade_id || !form.status_id) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    createMutation.mutate({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo_id: form.tipo_id,
      prioridade_id: form.prioridade_id,
      status_id: form.status_id,
    });
  };

  const loadingConfig = loadingTipos || loadingPrioridades || loadingStatus;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Abrir Novo Chamado
      </Typography>

      <Paper sx={{ p: 3 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {loadingConfig ? (
          <CircularProgress size={24} />
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Título"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  label="Descrição"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Tipo"
                  name="tipo_id"
                  value={form.tipo_id}
                  onChange={handleChange}
                  SelectProps={selectA11yProps}
                >
                  {tipos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {normalizePtBrText(item.nome)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Prioridade"
                  name="prioridade_id"
                  value={form.prioridade_id}
                  onChange={handleChange}
                  SelectProps={selectA11yProps}
                >
                  {prioridades.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {normalizePtBrText(item.nome)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Status"
                  name="status_id"
                  value={form.status_id}
                  onChange={handleChange}
                  SelectProps={selectA11yProps}
                >
                  {statusList.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {normalizePtBrText(item.nome)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={() => navigate('/ocorrencias')}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
                    {createMutation.isLoading ? 'Salvando...' : 'Abrir Chamado'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default AbrirChamado;
