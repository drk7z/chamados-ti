import React, { useMemo, useState } from 'react';
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
  descricao: '',
  email: '',
  ativo: true,
};

function Areas() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState('true');
  const [form, setForm] = useState(initialForm);

  const queryParams = useMemo(() => ({ busca, ativo }), [busca, ativo]);

  const { data: areas = [], isLoading, isError } = useQuery(
    ['admin-areas', queryParams],
    async () => {
      const response = await api.get('/admin/areas', { params: queryParams });
      return response.data || [];
    }
  );

  const saveMutation = useMutation(
    async (payload) => {
      if (payload.id) {
        const response = await api.put(`/admin/areas/${payload.id}`, payload);
        return response.data;
      }

      const response = await api.post('/admin/areas', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-areas');
        setForm(initialForm);
        toast.success('Área salva com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar área');
      },
    }
  );

  const inactivateMutation = useMutation(
    async (id) => {
      await api.delete(`/admin/areas/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-areas');
        toast.success('Área inativada com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao inativar área');
      },
    }
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'ativo' ? value === 'true' : value,
    }));
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      nome: item.nome || '',
      descricao: item.descricao || '',
      email: item.email || '',
      ativo: Boolean(item.ativo),
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      id: form.id,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      email: form.email.trim() || null,
      ativo: form.ativo,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Áreas de Atendimento
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              id="admin-areas-busca"
              name="busca"
              fullWidth
              label="Buscar por nome, descrição ou e-mail"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              id="admin-areas-ativo"
              name="ativo"
              fullWidth
              select
              label="Status"
              value={ativo}
              onChange={(e) => setAtivo(e.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="true">Ativas</MenuItem>
              <MenuItem value="false">Inativas</MenuItem>
              <MenuItem value="all">Todas</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {form.id ? 'Editar Área' : 'Nova Área'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id="admin-area-nome"
                name="nome"
                fullWidth
                required
                label="Nome"
                value={form.nome}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="admin-area-email"
                name="email"
                fullWidth
                label="E-mail"
                value={form.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="admin-area-descricao"
                name="descricao"
                fullWidth
                multiline
                minRows={2}
                label="Descrição"
                value={form.descricao}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="admin-area-ativo"
                name="ativo"
                fullWidth
                select
                label="Ativa"
                value={String(form.ativo)}
                onChange={handleFormChange}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </TextField>
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
          <Alert severity="error">Não foi possível carregar as áreas.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.email || '-'}</TableCell>
                    <TableCell>{item.ativo ? 'Ativa' : 'Inativa'}</TableCell>
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
                {!areas.length && (
                  <TableRow>
                    <TableCell colSpan={4}>Nenhuma área encontrada.</TableCell>
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

export default Areas;
