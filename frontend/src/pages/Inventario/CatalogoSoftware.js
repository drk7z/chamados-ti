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
  nome: '',
  fabricante: '',
  versao: '',
  categoria_id: '',
  tipo_licenca_id: '',
  descricao: '',
  ativo: true,
};

function CatalogoSoftware() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = React.useState('');
  const [ativo, setAtivo] = React.useState('true');
  const [form, setForm] = React.useState(initialForm);

  const { data: categorias = [] } = useQuery('software-categorias', async () => {
    const response = await api.get('/inventario/software/config/categorias');
    return response.data || [];
  });

  const { data: tiposLicenca = [] } = useQuery('software-tipos-licenca', async () => {
    const response = await api.get('/inventario/software/config/tipos-licenca');
    return response.data || [];
  });

  const { data, isLoading, isError } = useQuery(
    ['software-catalogo', busca, ativo],
    async () => {
      const response = await api.get('/inventario/software', {
        params: {
          page: 1,
          limit: 30,
          busca: busca || undefined,
          ativo,
        },
      });

      return response.data;
    }
  );

  const softwares = data?.softwares || [];

  const saveMutation = useMutation(
    async (payload) => {
      if (payload.id) {
        const response = await api.put(`/inventario/software/${payload.id}`, payload);
        return response.data;
      }

      const response = await api.post('/inventario/software', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Software salvo com sucesso');
        setForm(initialForm);
        queryClient.invalidateQueries('software-catalogo');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar software');
      },
    }
  );

  const inactivateMutation = useMutation(
    async (id) => {
      await api.delete(`/inventario/software/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Software inativado com sucesso');
        queryClient.invalidateQueries('software-catalogo');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao inativar software');
      },
    }
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      id: form.id,
      nome: form.nome.trim(),
      fabricante: form.fabricante.trim() || null,
      versao: form.versao.trim() || null,
      categoria_id: form.categoria_id || null,
      tipo_licenca_id: form.tipo_licenca_id || null,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    });
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      nome: item.nome || '',
      fabricante: item.fabricante || '',
      versao: item.versao || '',
      categoria_id: item.categoria_id || '',
      tipo_licenca_id: item.tipo_licenca_id || '',
      descricao: item.descricao || '',
      ativo: Boolean(item.ativo),
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Catálogo de Software
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              id="software-busca"
              name="busca"
              fullWidth
              label="Buscar por nome, fabricante ou versão"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              id="software-ativo"
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
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {form.id ? 'Editar software' : 'Novo software'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                id="software-nome"
                name="nome"
                fullWidth
                required
                label="Nome"
                value={form.nome}
                onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                id="software-fabricante"
                name="fabricante"
                fullWidth
                label="Fabricante"
                value={form.fabricante}
                onChange={(event) => setForm((prev) => ({ ...prev, fabricante: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                id="software-versao"
                name="versao"
                fullWidth
                label="Versão"
                value={form.versao}
                onChange={(event) => setForm((prev) => ({ ...prev, versao: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                id="software-categoria"
                name="categoria_id"
                fullWidth
                select
                label="Categoria"
                value={form.categoria_id}
                onChange={(event) => setForm((prev) => ({ ...prev, categoria_id: event.target.value }))}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="">Sem categoria</MenuItem>
                {categorias.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="software-tipo-licenca"
                name="tipo_licenca_id"
                fullWidth
                select
                label="Tipo de licença"
                value={form.tipo_licenca_id}
                onChange={(event) => setForm((prev) => ({ ...prev, tipo_licenca_id: event.target.value }))}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="">Sem tipo</MenuItem>
                {tiposLicenca.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                id="software-form-ativo"
                name="ativo"
                fullWidth
                select
                label="Ativo"
                value={String(form.ativo)}
                onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.value === 'true' }))}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="software-descricao"
                name="descricao"
                fullWidth
                multiline
                minRows={2}
                label="Descrição"
                value={form.descricao}
                onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setForm(initialForm)}>
                  Limpar
                </Button>
                <Button type="submit" variant="contained" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isError ? (
          <Alert severity="error">Não foi possível carregar o catálogo de software.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Fabricante</TableCell>
                  <TableCell>Versão</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Tipo Licença</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {softwares.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.fabricante || '-'}</TableCell>
                    <TableCell>{item.versao || '-'}</TableCell>
                    <TableCell>{item.categoria?.nome || '-'}</TableCell>
                    <TableCell>{item.tipo_licenca?.nome || '-'}</TableCell>
                    <TableCell>{item.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => handleEdit(item)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={!item.ativo || inactivateMutation.isLoading}
                          onClick={() => inactivateMutation.mutate(item.id)}
                        >
                          Inativar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!softwares.length && (
                  <TableRow>
                    <TableCell colSpan={7}>Nenhum software encontrado.</TableCell>
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

export default CatalogoSoftware;
