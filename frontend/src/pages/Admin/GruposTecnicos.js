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
  area_id: '',
  responsavel_id: '',
  ativo: true,
};

function GruposTecnicos() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState('true');
  const [form, setForm] = useState(initialForm);
  const [usuarioId, setUsuarioId] = useState('');

  const queryParams = useMemo(() => ({ busca, ativo }), [busca, ativo]);

  const { data: grupos = [], isLoading, isError } = useQuery(
    ['admin-grupos', queryParams],
    async () => {
      const response = await api.get('/admin/grupos-tecnicos', { params: queryParams });
      return response.data || [];
    }
  );

  const { data: areas = [] } = useQuery('admin-areas-options', async () => {
    const response = await api.get('/admin/areas', { params: { ativo: 'true' } });
    return response.data || [];
  });

  const { data: usuarios = [] } = useQuery('admin-usuarios-options', async () => {
    const response = await api.get('/admin/usuarios');
    return response.data || [];
  });

  const saveMutation = useMutation(
    async (payload) => {
      if (payload.id) {
        const response = await api.put(`/admin/grupos-tecnicos/${payload.id}`, payload);
        return response.data;
      }

      const response = await api.post('/admin/grupos-tecnicos', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-grupos');
        setForm(initialForm);
        toast.success('Grupo técnico salvo com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar grupo técnico');
      },
    }
  );

  const inactivateMutation = useMutation(
    async (id) => {
      await api.delete(`/admin/grupos-tecnicos/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-grupos');
        toast.success('Grupo técnico inativado com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao inativar grupo técnico');
      },
    }
  );

  const linkUserMutation = useMutation(
    async ({ grupoId, payload }) => {
      const response = await api.post(`/admin/grupos-tecnicos/${grupoId}/usuarios`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-grupos');
        setUsuarioId('');
        toast.success('Usuário vinculado ao grupo');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao vincular usuário');
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

  const handleSubmit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      id: form.id,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      email: form.email.trim() || null,
      area_id: form.area_id || null,
      responsavel_id: form.responsavel_id || null,
      ativo: form.ativo,
    });
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      nome: item.nome || '',
      descricao: item.descricao || '',
      email: item.email || '',
      area_id: item.area_id || '',
      responsavel_id: item.responsavel_id || '',
      ativo: Boolean(item.ativo),
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Grupos Técnicos
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              id="admin-grupos-busca"
              name="busca"
              fullWidth
              label="Buscar por nome, descrição ou e-mail"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              id="admin-grupos-ativo"
              name="ativo"
              fullWidth
              select
              label="Status"
              value={ativo}
              onChange={(e) => setAtivo(e.target.value)}
              SelectProps={selectA11yProps}
            >
              <MenuItem value="true">Ativos</MenuItem>
              <MenuItem value="false">Inativos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {form.id ? 'Editar Grupo Técnico' : 'Novo Grupo Técnico'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id="admin-grupo-nome"
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
                id="admin-grupo-email"
                name="email"
                fullWidth
                label="E-mail"
                value={form.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="admin-grupo-area"
                name="area_id"
                fullWidth
                select
                label="Área"
                value={form.area_id}
                onChange={handleFormChange}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="">Sem área</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="admin-grupo-responsavel"
                name="responsavel_id"
                fullWidth
                select
                label="Responsável"
                value={form.responsavel_id}
                onChange={handleFormChange}
                SelectProps={selectA11yProps}
              >
                <MenuItem value="">Sem responsável</MenuItem>
                {usuarios.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="admin-grupo-descricao"
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
                id="admin-grupo-ativo"
                name="ativo"
                fullWidth
                select
                label="Ativo"
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
          <Alert severity="error">Não foi possível carregar os grupos técnicos.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Membros</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grupos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.area?.nome || '-'}</TableCell>
                    <TableCell>{item.responsavel?.nome || '-'}</TableCell>
                    <TableCell>{item.usuarios?.length || 0}</TableCell>
                    <TableCell>{item.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
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
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <TextField
                          id={`admin-grupo-usuario-${item.id}`}
                          name="usuarioId"
                          size="small"
                          select
                          label="Vincular usuário"
                          value={usuarioId}
                          onChange={(event) => setUsuarioId(event.target.value)}
                          sx={{ minWidth: 220 }}
                          SelectProps={selectA11yProps}
                        >
                          <MenuItem value="">Selecione</MenuItem>
                          {usuarios.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.nome}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!usuarioId || linkUserMutation.isLoading}
                          onClick={() => linkUserMutation.mutate({ grupoId: item.id, payload: { usuario_id: usuarioId } })}
                        >
                          Vincular
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!grupos.length && (
                  <TableRow>
                    <TableCell colSpan={6}>Nenhum grupo técnico encontrado.</TableCell>
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

export default GruposTecnicos;
