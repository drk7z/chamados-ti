import React from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { selectA11yProps } from '../../utils/selectAccessibility';

const statusColor = (tipo) => {
  switch (tipo) {
    case 'aberto':
      return 'warning';
    case 'em_andamento':
      return 'info';
    case 'resolvido':
      return 'success';
    case 'fechado':
      return 'default';
    default:
      return 'default';
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

function DetalhesChamado() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [comentario, setComentario] = React.useState('');
  const [tecnicoId, setTecnicoId] = React.useState('');
  const [areaId, setAreaId] = React.useState('');
  const [motivoTransferencia, setMotivoTransferencia] = React.useState('');
  const [motivoPausa, setMotivoPausa] = React.useState('');
  const [solucao, setSolucao] = React.useState('');

  const {
    data: chamado,
    isLoading: loadingChamado,
    isError: errorChamado,
  } = useQuery(['ocorrencia-detalhes', id], async () => {
    const response = await api.get(`/ocorrencias/${id}`);
    return response.data;
  });

  const {
    data: historico,
    isLoading: loadingHistorico,
  } = useQuery(['ocorrencia-historico', id], async () => {
    const response = await api.get(`/ocorrencias/${id}/historico`);
    return response.data;
  });

  const {
    data: comentarios,
    isLoading: loadingComentarios,
  } = useQuery(['ocorrencia-comentarios', id], async () => {
    const response = await api.get(`/ocorrencias/${id}/comentarios`);
    return response.data;
  });

  const {
    data: slaEventos,
    isLoading: loadingSla,
  } = useQuery(['ocorrencia-sla-eventos', id], async () => {
    const response = await api.get(`/ocorrencias/${id}/sla-eventos`);
    return response.data;
  });

  const { data: tecnicos = [], isLoading: loadingTecnicos } = useQuery('ocorrencia-tecnicos', async () => {
    const response = await api.get('/ocorrencias/config/tecnicos');
    return response.data;
  });

  const { data: areas = [], isLoading: loadingAreas } = useQuery('ocorrencia-areas', async () => {
    const response = await api.get('/ocorrencias/config/areas');
    return response.data;
  });

  const comentarMutation = useMutation(
    async () => {
      const response = await api.post(`/ocorrencias/${id}/comentar`, {
        comentario: comentario.trim(),
        tipo: 'publico',
      });
      return response.data;
    },
    {
      onSuccess: () => {
        setComentario('');
        toast.success('Comentário adicionado');
        queryClient.invalidateQueries(['ocorrencia-comentarios', id]);
        queryClient.invalidateQueries(['ocorrencia-historico', id]);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || 'Falha ao comentar');
      },
    }
  );

  const actionMutation = useMutation(
    async ({ action, payload = {} }) => {
      const response = await api.post(`/ocorrencias/${id}/${action}`, payload);
      return response.data;
    },
    {
      onSuccess: (_data, variables) => {
        const actionLabel = variables?.action || 'ação';
        toast.success(`Ação executada: ${actionLabel}`);
        queryClient.invalidateQueries(['ocorrencia-detalhes', id]);
        queryClient.invalidateQueries(['ocorrencia-historico', id]);
        queryClient.invalidateQueries(['ocorrencia-comentarios', id]);
        queryClient.invalidateQueries(['ocorrencia-sla-eventos', id]);
        queryClient.invalidateQueries('ocorrencias-list');
        queryClient.invalidateQueries('dashboard-stats');
        queryClient.invalidateQueries('dashboard-meus-chamados');
        queryClient.invalidateQueries('dashboard-metricas-sla');
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || 'Falha ao executar ação');
      },
    }
  );

  const handleComentar = (event) => {
    event.preventDefault();
    if (!comentario.trim()) return;
    comentarMutation.mutate();
  };

  const handleAtribuir = () => {
    if (!tecnicoId.trim()) {
      toast.error('Informe o ID do técnico para atribuir');
      return;
    }
    actionMutation.mutate({ action: 'atribuir', payload: { tecnico_id: tecnicoId.trim() } });
  };

  const handleTransferir = () => {
    if (!areaId.trim()) {
      toast.error('Informe o ID da área para transferir');
      return;
    }
    actionMutation.mutate({
      action: 'transferir',
      payload: {
        area_id: areaId.trim(),
        motivo: motivoTransferencia.trim() || undefined,
      },
    });
  };

  const handlePausar = () => {
    if (!motivoPausa.trim()) {
      toast.error('Informe o motivo da pausa');
      return;
    }
    actionMutation.mutate({ action: 'pausar', payload: { motivo: motivoPausa.trim() } });
  };

  const handleRetomar = () => {
    actionMutation.mutate({ action: 'retomar' });
  };

  const handleResolver = () => {
    if (!solucao.trim()) {
      toast.error('Informe a solução para resolver o chamado');
      return;
    }
    actionMutation.mutate({ action: 'resolver', payload: { solucao: solucao.trim() } });
  };

  const handleFechar = () => {
    actionMutation.mutate({ action: 'fechar' });
  };

  const handleReabrir = () => {
    actionMutation.mutate({ action: 'reabrir' });
  };

  const statusTipo = chamado?.status?.tipo;
  const isFechadoOuCancelado = ['fechado', 'cancelado'].includes(statusTipo);
  const isResolvidoOuFechado = ['resolvido', 'fechado'].includes(statusTipo);
  const isPausado = Boolean(chamado?.pausado);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Detalhes do Chamado #{id}
      </Typography>

      {errorChamado && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Não foi possível carregar o chamado.
        </Alert>
      )}

      {loadingChamado ? (
        <CircularProgress size={24} />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">{chamado?.titulo}</Typography>
                <Chip
                  label={chamado?.status?.nome || 'Sem status'}
                  color={statusColor(chamado?.status?.tipo)}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Prioridade: {chamado?.prioridade?.nome || '-'} • Tipo: {chamado?.tipo?.nome || '-'}
              </Typography>
              <Typography variant="body1">{chamado?.descricao}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Solicitante: {chamado?.solicitante?.nome || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Técnico: {chamado?.tecnico_responsavel?.nome || 'Não atribuído'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abertura: {formatDate(chamado?.created_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prazo SLA: {formatDate(chamado?.prazo_sla)}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Comentários
              </Typography>

              <Box component="form" onSubmit={handleComentar} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Adicionar comentário"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="contained" disabled={comentarMutation.isLoading}>
                    {comentarMutation.isLoading ? 'Salvando...' : 'Comentar'}
                  </Button>
                </Box>
              </Box>

              {loadingComentarios ? (
                <CircularProgress size={20} />
              ) : (
                <List dense>
                  {(comentarios || []).map((item) => (
                    <ListItem key={item.id} divider alignItems="flex-start">
                      <ListItemText
                        primary={`${item.usuario?.nome || 'Usuário'} • ${formatDate(item.created_at)}`}
                        secondary={item.comentario}
                      />
                    </ListItem>
                  ))}
                  {!comentarios?.length && (
                    <ListItem>
                      <ListItemText primary="Nenhum comentário até o momento." />
                    </ListItem>
                  )}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Histórico
              </Typography>
              {loadingHistorico ? (
                <CircularProgress size={20} />
              ) : (
                <List dense>
                  {(historico || []).slice(0, 10).map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemText
                        primary={`${item.tipo} • ${formatDate(item.created_at)}`}
                        secondary={item.descricao}
                      />
                    </ListItem>
                  ))}
                  {!historico?.length && (
                    <ListItem>
                      <ListItemText primary="Sem eventos de histórico." />
                    </ListItem>
                  )}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ações Operacionais
              </Typography>

              <Stack spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label="Técnico para atribuição"
                  value={tecnicoId}
                  onChange={(event) => setTecnicoId(event.target.value)}
                  disabled={loadingTecnicos}
                  SelectProps={selectA11yProps}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {tecnicos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome} ({item.email || 'sem email'})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Área para transferência"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  disabled={loadingAreas}
                  SelectProps={selectA11yProps}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {areas.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  onClick={handleAtribuir}
                  disabled={actionMutation.isLoading || isFechadoOuCancelado}
                >
                  Atribuir Técnico
                </Button>
                <TextField
                  size="small"
                  label="Motivo da transferência (opcional)"
                  value={motivoTransferencia}
                  onChange={(event) => setMotivoTransferencia(event.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={handleTransferir}
                  disabled={actionMutation.isLoading || isFechadoOuCancelado}
                >
                  Transferir
                </Button>

                <TextField
                  size="small"
                  label="Motivo da pausa"
                  value={motivoPausa}
                  onChange={(event) => setMotivoPausa(event.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handlePausar}
                    disabled={actionMutation.isLoading || isFechadoOuCancelado || isPausado}
                  >
                    Pausar
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleRetomar}
                    disabled={actionMutation.isLoading || isFechadoOuCancelado || !isPausado}
                  >
                    Retomar
                  </Button>
                </Stack>

                <TextField
                  size="small"
                  label="Solução"
                  value={solucao}
                  onChange={(event) => setSolucao(event.target.value)}
                  multiline
                  minRows={2}
                />
                <Button
                  variant="contained"
                  onClick={handleResolver}
                  disabled={actionMutation.isLoading || isFechadoOuCancelado || statusTipo === 'resolvido'}
                >
                  Resolver
                </Button>

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={handleFechar}
                    disabled={actionMutation.isLoading || statusTipo === 'fechado' || statusTipo === 'cancelado'}
                  >
                    Fechar
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleReabrir}
                    disabled={actionMutation.isLoading || !isResolvidoOuFechado}
                  >
                    Reabrir
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Timeline SLA
              </Typography>
              {loadingSla ? (
                <CircularProgress size={20} />
              ) : (
                <List dense>
                  {(slaEventos?.eventos || []).slice(-10).reverse().map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemText
                        primary={`${item.status} • ${formatDate(item.created_at)}`}
                        secondary={`Evento: ${item.tipo_evento}`}
                      />
                    </ListItem>
                  ))}
                  {!slaEventos?.eventos?.length && (
                    <ListItem>
                      <ListItemText primary="Sem eventos de SLA." />
                    </ListItem>
                  )}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default DetalhesChamado;
