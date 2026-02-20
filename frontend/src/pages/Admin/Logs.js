import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { selectA11yProps } from '../../utils/selectAccessibility';

function Logs() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [modulo, setModulo] = useState('');
  const [acao, setAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      busca: busca || undefined,
      modulo: modulo || undefined,
      acao: acao || undefined,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
    }),
    [page, busca, modulo, acao, dataInicio, dataFim]
  );

  const { data, isLoading, isError, refetch } = useQuery(
    ['admin-logs', params],
    async () => {
      const response = await api.get('/admin/logs', { params });
      return response.data;
    }
  );

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Logs Administrativos
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              id="admin-logs-busca"
              name="busca"
              fullWidth
              label="Busca"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="admin-logs-modulo"
              name="modulo"
              fullWidth
              label="Módulo"
              value={modulo}
              onChange={(event) => setModulo(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="admin-logs-acao"
              name="acao"
              fullWidth
              label="Ação"
              value={acao}
              onChange={(event) => setAcao(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ height: '56px' }}
              onClick={() => {
                setPage(1);
                refetch();
              }}
            >
              Filtrar
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="admin-logs-data-inicio"
              name="data_inicio"
              fullWidth
              type="date"
              label="Data início"
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="admin-logs-data-fim"
              name="data_fim"
              fullWidth
              type="date"
              label="Data fim"
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              id="admin-logs-page"
              name="page"
              fullWidth
              select
              label="Página"
              value={String(page)}
              onChange={(event) => setPage(Number(event.target.value))}
              SelectProps={selectA11yProps}
            >
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageValue) => (
                <MenuItem key={pageValue} value={String(pageValue)}>
                  {pageValue}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isError ? (
          <Alert severity="error">Não foi possível carregar os logs.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Ação</TableCell>
                  <TableCell>Entidade</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Usuário</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{item.modulo}</TableCell>
                    <TableCell>{item.acao}</TableCell>
                    <TableCell>{item.entidade || '-'}</TableCell>
                    <TableCell>{item.descricao || '-'}</TableCell>
                    <TableCell>{item.usuario?.nome || '-'}</TableCell>
                  </TableRow>
                ))}
                {!logs.length && (
                  <TableRow>
                    <TableCell colSpan={6}>Nenhum log encontrado para os filtros informados.</TableCell>
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

export default Logs;
