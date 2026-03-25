import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../services/api';
import { selectA11yProps } from '../../utils/selectAccessibility';

function ListarAtivos() {
  const navigate = useNavigate();
  const [busca, setBusca] = React.useState('');
  const [tipo, setTipo] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [ativo, setAtivo] = React.useState('true');

  const { data: tipos = [] } = useQuery('inventario-tipos', async () => {
    const response = await api.get('/inventario/config/tipos');
    return response.data || [];
  });

  const { data: statusList = [] } = useQuery('inventario-status', async () => {
    const response = await api.get('/inventario/config/status');
    return response.data || [];
  });

  const { data, isLoading, isError, refetch } = useQuery(
    ['inventario-list', busca, tipo, status, ativo],
    async () => {
      const response = await api.get('/inventario', {
        params: {
          page: 1,
          limit: 30,
          busca: busca || undefined,
          tipo: tipo || undefined,
          status: status || undefined,
          ativo,
        },
      });

      return response.data;
    }
  );

  const ativos = data?.ativos || [];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Gerenciar Ativos</Typography>
        <Button variant="contained" onClick={() => navigate('/inventario/novo')}>
          Novo Ativo
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              id="inventario-busca"
              name="busca"
              fullWidth
              label="Buscar por nome, código, série ou patrimônio"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="inventario-tipo"
              name="tipo"
              fullWidth
              select
              label="Tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="">Todos</MenuItem>
              {tipos.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="inventario-status"
              name="status"
              fullWidth
              select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="">Todos</MenuItem>
              {statusList.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              id="inventario-ativo"
              name="ativo"
              fullWidth
              select
              label="Ativo"
              value={ativo}
              onChange={(event) => setAtivo(event.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="true">Sim</MenuItem>
              <MenuItem value="false">Não</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" onClick={() => refetch()}>
              Atualizar lista
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isError ? (
          <Alert severity="error">Não foi possível carregar os ativos.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Responsável</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ativos.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/inventario/${item.id}`)}
                  >
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.tipo?.nome || '-'}</TableCell>
                    <TableCell>{item.status?.nome || '-'}</TableCell>
                    <TableCell>{item.responsavel?.nome || '-'}</TableCell>
                  </TableRow>
                ))}
                {!ativos.length && (
                  <TableRow>
                    <TableCell colSpan={5}>Nenhum ativo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default ListarAtivos;
