import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import api from '../../services/api';
import { normalizePtBrText } from '../../utils/text';
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

function ListarChamados() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [busca, setBusca] = React.useState('');
  const [status, setStatus] = React.useState('');

  const {
    data: statusOptions,
    isLoading: loadingStatus,
  } = useQuery('ocorrencias-status-options', async () => {
    const response = await api.get('/ocorrencias/config/status');
    return response.data;
  });

  const {
    data: chamadosData,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    ['ocorrencias-list', page, busca, status],
    async () => {
      const response = await api.get('/ocorrencias', {
        params: {
          page,
          limit: 10,
          busca: busca || undefined,
          status: status || undefined,
        },
      });
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  const handleFiltrar = () => {
    setPage(1);
    refetch();
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Gerenciar Chamados</Typography>
        <Button variant="contained" onClick={() => navigate('/ocorrencias/abrir')}>
          Abrir Chamado
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Buscar por título, descrição ou número"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loadingStatus}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="">Todos</MenuItem>
              {(statusOptions || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {normalizePtBrText(item.nome)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" onClick={handleFiltrar} sx={{ height: '56px' }}>
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Não foi possível carregar chamados.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Técnico</TableCell>
                    <TableCell>Abertura</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(chamadosData?.chamados || []).map((item) => (
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
                          color={statusColor(item.status?.tipo)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{normalizePtBrText(item.prioridade?.nome || '-')}</TableCell>
                      <TableCell>{item.tecnico_responsavel?.nome || 'Não atribuído'}</TableCell>
                      <TableCell>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!chamadosData?.chamados?.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhum chamado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total: {chamadosData?.total || 0} chamados
              </Typography>
              <Pagination
                page={page}
                count={chamadosData?.totalPages || 1}
                onChange={(_, nextPage) => setPage(nextPage)}
                color="primary"
              />
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default ListarChamados;
