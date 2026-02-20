import React from 'react';
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
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { selectA11yProps } from '../../utils/selectAccessibility';

const initialForm = {
  id: null,
  software_id: '',
  tipo_licenca_id: '',
  quantidade_licencas: 1,
  em_uso: 0,
  data_aquisicao: '',
  data_expiracao: '',
  valor: '',
  fornecedor: '',
  observacoes: '',
  ativo: true,
};

function LicencasSoftware() {
  const queryClient = useQueryClient();
  const [filtroAtivo, setFiltroAtivo] = React.useState('true');
  const [filtroSoftware, setFiltroSoftware] = React.useState('');
  const [form, setForm] = React.useState(initialForm);

  const { data: softwaresData } = useQuery('software-catalogo-options', async () => {
    const response = await api.get('/inventario/software', { params: { page: 1, limit: 100, ativo: 'true' } });
    return response.data;
  });

  const { data: tiposLicenca = [] } = useQuery('licencas-tipos-licenca', async () => {
    const response = await api.get('/inventario/software/config/tipos-licenca');
    return response.data || [];
  });

  const softwares = softwaresData?.softwares || [];

  const { data: licencasData, isLoading, isError } = useQuery(
    ['licencas-list', filtroAtivo, filtroSoftware],
    async () => {
      const response = await api.get('/inventario/licencas', {
        params: {
          page: 1,
          limit: 50,
          ativo: filtroAtivo,
          software_id: filtroSoftware || undefined,
        },
      });

      return response.data;
    }
  );

  const { data: proximasExpiracao = [] } = useQuery('licencas-proximas-expiracao', async () => {
    const response = await api.get('/inventario/licencas/proximas-expiracao', { params: { dias: 30 } });
    return response.data || [];
  });

  const licencas = licencasData?.licencas || [];

  const saveMutation = useMutation(
    async (payload) => {
      if (payload.id) {
        const response = await api.put(`/inventario/licencas/${payload.id}`, payload);
        return response.data;
      }

      const response = await api.post('/inventario/licencas', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Licença salva com sucesso');
        setForm(initialForm);
        queryClient.invalidateQueries('licencas-list');
        queryClient.invalidateQueries('licencas-proximas-expiracao');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar licença');
      },
    }
  );

  const inactivateMutation = useMutation(
    async (id) => {
      await api.delete(`/inventario/licencas/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Licença inativada com sucesso');
        queryClient.invalidateQueries('licencas-list');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao inativar licença');
      },
    }
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      id: form.id,
      software_id: form.software_id,
      tipo_licenca_id: form.tipo_licenca_id,
      quantidade_licencas: Number(form.quantidade_licencas),
      em_uso: Number(form.em_uso),
      data_aquisicao: form.data_aquisicao || null,
      data_expiracao: form.data_expiracao || null,
      valor: form.valor || null,
      fornecedor: form.fornecedor?.trim() || null,
      observacoes: form.observacoes?.trim() || null,
      ativo: form.ativo,
    });
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      software_id: item.software_id || '',
      tipo_licenca_id: item.tipo_licenca_id || '',
      quantidade_licencas: item.quantidade_licencas || 1,
      em_uso: item.em_uso || 0,
      data_aquisicao: item.data_aquisicao || '',
      data_expiracao: item.data_expiracao || '',
      valor: item.valor || '',
      fornecedor: item.fornecedor || '',
      observacoes: item.observacoes || '',
      ativo: Boolean(item.ativo),
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Licenças de Software
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Alertas de vencimento (30 dias)
        </Typography>
        {proximasExpiracao.length ? (
          proximasExpiracao.map((item) => (
            <Alert key={item.id} severity="warning" sx={{ mb: 1 }}>
              {item.software?.nome || 'Software'} expira em {item.data_expiracao}
            </Alert>
          ))
        ) : (
          <Alert severity="success">Nenhuma licença próxima do vencimento.</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              id="licencas-filtro-software"
              name="software_id"
              fullWidth
              select
              label="Software"
              value={filtroSoftware}
              onChange={(event) => setFiltroSoftware(event.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="">Todos</MenuItem>
              {softwares.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id="licencas-filtro-ativo"
              name="ativo"
              fullWidth
              select
              label="Ativo"
              value={filtroAtivo}
              onChange={(event) => setFiltroAtivo(event.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="true">Sim</MenuItem>
              <MenuItem value="false">Não</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {form.id ? 'Editar licença' : 'Nova licença'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField id="licenca-software" name="software_id" fullWidth required select label="Software" value={form.software_id} onChange={(event) => setForm((prev) => ({ ...prev, software_id: event.target.value }))} SelectProps={selectA11yProps}>
                {softwares.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField id="licenca-tipo" name="tipo_licenca_id" fullWidth required select label="Tipo licença" value={form.tipo_licenca_id} onChange={(event) => setForm((prev) => ({ ...prev, tipo_licenca_id: event.target.value }))} SelectProps={selectA11yProps}>
                {tiposLicenca.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField id="licenca-quantidade" name="quantidade_licencas" fullWidth required type="number" label="Quantidade" inputProps={{ min: 1 }} value={form.quantidade_licencas} onChange={(event) => setForm((prev) => ({ ...prev, quantidade_licencas: event.target.value }))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField id="licenca-em-uso" name="em_uso" fullWidth required type="number" label="Em uso" inputProps={{ min: 0 }} value={form.em_uso} onChange={(event) => setForm((prev) => ({ ...prev, em_uso: event.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField id="licenca-data-aquisicao" name="data_aquisicao" fullWidth type="date" label="Aquisição" InputLabelProps={{ shrink: true }} value={form.data_aquisicao} onChange={(event) => setForm((prev) => ({ ...prev, data_aquisicao: event.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField id="licenca-data-expiracao" name="data_expiracao" fullWidth type="date" label="Expiração" InputLabelProps={{ shrink: true }} value={form.data_expiracao} onChange={(event) => setForm((prev) => ({ ...prev, data_expiracao: event.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField id="licenca-valor" name="valor" fullWidth type="number" label="Valor" value={form.valor} onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField id="licenca-fornecedor" name="fornecedor" fullWidth label="Fornecedor" value={form.fornecedor} onChange={(event) => setForm((prev) => ({ ...prev, fornecedor: event.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField id="licenca-observacoes" name="observacoes" fullWidth multiline minRows={2} label="Observações" value={form.observacoes} onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setForm(initialForm)}>Limpar</Button>
                <Button type="submit" variant="contained" disabled={saveMutation.isLoading}>{saveMutation.isLoading ? 'Salvando...' : 'Salvar'}</Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isError ? (
          <Alert severity="error">Não foi possível carregar licenças.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Software</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Qtd</TableCell>
                  <TableCell>Uso</TableCell>
                  <TableCell>Expiração</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {licencas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.software?.nome || '-'}</TableCell>
                    <TableCell>{item.tipo_licenca?.nome || '-'}</TableCell>
                    <TableCell>{item.quantidade_licencas}</TableCell>
                    <TableCell>{item.em_uso}</TableCell>
                    <TableCell>{item.data_expiracao || '-'}</TableCell>
                    <TableCell>{item.status_vencimento}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => handleEdit(item)}>Editar</Button>
                        <Button size="small" color="error" variant="outlined" disabled={!item.ativo || inactivateMutation.isLoading} onClick={() => inactivateMutation.mutate(item.id)}>Inativar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!licencas.length && (
                  <TableRow>
                    <TableCell colSpan={7}>Nenhuma licença encontrada.</TableCell>
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

export default LicencasSoftware;
