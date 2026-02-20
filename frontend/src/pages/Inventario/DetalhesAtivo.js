import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { selectA11yProps } from '../../utils/selectAccessibility';

function DetalhesAtivo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    codigo: '',
    nome: '',
    tipo_id: '',
    status_id: '',
    categoria_id: '',
    observacoes: '',
  });
  const [movimentacao, setMovimentacao] = React.useState({
    localizacao_nova_id: '',
    responsavel_novo_id: '',
    motivo: '',
  });

  const { data: ativo, isLoading, isError } = useQuery(['inventario-ativo', id], async () => {
    const response = await api.get(`/inventario/${id}`);
    return response.data;
  });

  const { data: tipos = [] } = useQuery('inventario-config-tipos', async () => {
    const response = await api.get('/inventario/config/tipos');
    return response.data || [];
  });

  const { data: statusList = [] } = useQuery('inventario-config-status', async () => {
    const response = await api.get('/inventario/config/status');
    return response.data || [];
  });

  const { data: categorias = [] } = useQuery('inventario-config-categorias', async () => {
    const response = await api.get('/inventario/config/categorias');
    return response.data || [];
  });

  const { data: responsaveis = [] } = useQuery('inventario-config-responsaveis', async () => {
    const response = await api.get('/inventario/config/responsaveis');
    return response.data || [];
  });

  const { data: unidades = [] } = useQuery('inventario-config-unidades', async () => {
    const response = await api.get('/inventario/config/unidades');
    return response.data || [];
  });

  const { data: historico = [], isLoading: loadingHistorico } = useQuery(['inventario-historico', id], async () => {
    const response = await api.get(`/inventario/${id}/historico`);
    return response.data || [];
  });

  React.useEffect(() => {
    if (!ativo) return;

    setForm({
      codigo: ativo.codigo || '',
      nome: ativo.nome || '',
      tipo_id: ativo.tipo_id || '',
      status_id: ativo.status_id || '',
      categoria_id: ativo.categoria_id || '',
      observacoes: ativo.observacoes || '',
    });
  }, [ativo]);

  const updateMutation = useMutation(
    async (payload) => {
      const response = await api.put(`/inventario/${id}`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Ativo atualizado com sucesso');
        queryClient.invalidateQueries(['inventario-ativo', id]);
        queryClient.invalidateQueries('inventario-list');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao atualizar ativo');
      },
    }
  );

  const movimentarMutation = useMutation(
    async (payload) => {
      const response = await api.post(`/inventario/${id}/movimentar`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Movimentação registrada com sucesso');
        setMovimentacao({ localizacao_nova_id: '', responsavel_novo_id: '', motivo: '' });
        queryClient.invalidateQueries(['inventario-ativo', id]);
        queryClient.invalidateQueries(['inventario-historico', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao movimentar ativo');
      },
    }
  );

  const handleSave = (event) => {
    event.preventDefault();
    updateMutation.mutate({
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      tipo_id: form.tipo_id,
      status_id: form.status_id,
      categoria_id: form.categoria_id || null,
      observacoes: form.observacoes?.trim() || null,
    });
  };

  const handleMovimentar = (event) => {
    event.preventDefault();
    movimentarMutation.mutate({
      localizacao_nova_id: movimentacao.localizacao_nova_id || null,
      responsavel_novo_id: movimentacao.responsavel_novo_id || null,
      motivo: movimentacao.motivo,
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Detalhes do Ativo</Typography>
        <Button variant="outlined" onClick={() => navigate('/inventario')}>
          Voltar
        </Button>
      </Stack>

      {isLoading ? (
        <CircularProgress size={24} />
      ) : isError ? (
        <Alert severity="error">Não foi possível carregar o ativo.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Atualização do Ativo
              </Typography>

              <form onSubmit={handleSave}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField id="ativo-codigo" name="codigo" fullWidth required label="Código" value={form.codigo} onChange={(event) => setForm((prev) => ({ ...prev, codigo: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField id="ativo-nome" name="nome" fullWidth required label="Nome" value={form.nome} onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField id="ativo-tipo" name="tipo_id" fullWidth required select label="Tipo" value={form.tipo_id} onChange={(event) => setForm((prev) => ({ ...prev, tipo_id: event.target.value }))} SelectProps={selectA11yProps}>
                      {tipos.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField id="ativo-status" name="status_id" fullWidth required select label="Status" value={form.status_id} onChange={(event) => setForm((prev) => ({ ...prev, status_id: event.target.value }))} SelectProps={selectA11yProps}>
                      {statusList.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField id="ativo-categoria" name="categoria_id" fullWidth select label="Categoria" value={form.categoria_id} onChange={(event) => setForm((prev) => ({ ...prev, categoria_id: event.target.value }))} SelectProps={selectA11yProps}>
                      <MenuItem value="">Sem categoria</MenuItem>
                      {categorias.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField id="ativo-observacoes" name="observacoes" fullWidth multiline minRows={3} label="Observações" value={form.observacoes} onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" disabled={updateMutation.isLoading}>
                      {updateMutation.isLoading ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Movimentação
              </Typography>

              <form onSubmit={handleMovimentar}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField id="mov-localizacao" name="localizacao_nova_id" fullWidth required select label="Nova localização" value={movimentacao.localizacao_nova_id} onChange={(event) => setMovimentacao((prev) => ({ ...prev, localizacao_nova_id: event.target.value }))} SelectProps={selectA11yProps}>
                      <MenuItem value="" disabled>Selecione</MenuItem>
                      {unidades.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField id="mov-responsavel" name="responsavel_novo_id" fullWidth select label="Novo responsável" value={movimentacao.responsavel_novo_id} onChange={(event) => setMovimentacao((prev) => ({ ...prev, responsavel_novo_id: event.target.value }))} SelectProps={selectA11yProps}>
                      <MenuItem value="">Manter responsável</MenuItem>
                      {responsaveis.map((item) => (
                        <MenuItem key={item.id} value={item.id}>{item.nome} ({item.email})</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField id="mov-motivo" name="motivo" fullWidth required label="Motivo" value={movimentacao.motivo} onChange={(event) => setMovimentacao((prev) => ({ ...prev, motivo: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="outlined" disabled={movimentarMutation.isLoading}>
                      {movimentarMutation.isLoading ? 'Movimentando...' : 'Registrar movimentação'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Histórico de Movimentação
              </Typography>

              {loadingHistorico ? (
                <CircularProgress size={20} />
              ) : (
                <List dense>
                  {historico.map((item) => (
                    <ListItem key={item.id} divider alignItems="flex-start">
                      <ListItemText
                        primary={new Date(item.data_movimentacao).toLocaleString('pt-BR')}
                        secondary={`De: ${item.localizacao_anterior?.nome || '-'} | Para: ${item.localizacao_nova?.nome || '-'}\nResponsável: ${item.responsavel_novo?.nome || '-'}\nMotivo: ${item.motivo || '-'}\nPor: ${item.realizado_por?.nome || '-'}`}
                      />
                    </ListItem>
                  ))}
                  {!historico.length && <ListItem><ListItemText primary="Nenhuma movimentação registrada." /></ListItem>}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default DetalhesAtivo;
