import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ConfirmationNumber,
  CheckCircle,
  Pending,
  Warning,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { normalizePtBrText } from '../../utils/text';

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

function Dashboard() {
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading: loadingStats,
    isError: statsError,
  } = useQuery('dashboard-stats', async () => {
    const response = await api.get('/home/dashboard');
    return response.data;
  });

  const {
    data: meusChamados,
    isLoading: loadingMeusChamados,
    isError: meusChamadosError,
  } = useQuery('dashboard-meus-chamados', async () => {
    const response = await api.get('/home/meus-chamados');
    return response.data;
  });

  const {
    data: metricasSla,
    isLoading: loadingMetricasSla,
  } = useQuery('dashboard-metricas-sla', async () => {
    const response = await api.get('/ocorrencias/metricas/sla');
    return response.data;
  });

  const cards = [
    {
      title: 'Total de Chamados',
      value: stats?.totalChamados || 0,
      icon: <ConfirmationNumber sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Chamados Abertos',
      value: stats?.chamadosAbertos || 0,
      icon: <Pending sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Em Andamento',
      value: stats?.chamadosEmAndamento || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'SLA Vencendo',
      value: stats?.slaVencendo || 0,
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {(statsError || meusChamadosError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Não foi possível carregar todos os dados do dashboard.
        </Alert>
      )}

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" color="text.secondary">
                      {card.title}
                    </Typography>
                    {loadingStats ? (
                      <CircularProgress size={24} sx={{ mt: 1 }} />
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1 }}>
                        {card.value}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Meus Chamados Recentes</Typography>
              <Button size="small" onClick={() => navigate('/home/meus-chamados')}>
                Ver todos
              </Button>
            </Stack>

            {loadingMeusChamados ? (
              <CircularProgress size={24} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(meusChamados || []).slice(0, 5).map((item) => (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/ocorrencias/${item.id}`)}
                      >
                        <TableCell>{item.numero || '-'}</TableCell>
                        <TableCell>{item.titulo}</TableCell>
                        <TableCell>
                          <Chip
                            label={normalizePtBrText(item.status?.nome || 'Sem status')}
                            size="small"
                            color={statusColor(item.status?.tipo)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!meusChamados?.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          Nenhum chamado encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Avisos
            </Typography>
            {loadingMetricasSla ? (
              <CircularProgress size={24} />
            ) : (
              <Stack spacing={1}>
                <Alert severity={(metricasSla?.resumo?.sla_vencido || 0) > 0 ? 'warning' : 'success'}>
                  SLA vencido em aberto: {metricasSla?.resumo?.sla_vencido || 0}
                </Alert>
                <Alert severity="info">
                  SLA em risco: {metricasSla?.resumo?.sla_em_risco || 0}
                </Alert>
                <Alert severity="info">
                  Taxa de cumprimento: {metricasSla?.desempenho?.taxa_cumprimento_percentual || 0}%
                </Alert>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
