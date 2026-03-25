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
  razao_social: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
  ativo: true,
};

function ListarClientes() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState('true');
  const [form, setForm] = useState(initialForm);

  const queryParams = useMemo(
    () => ({ busca: busca || undefined, ativo }),
    [busca, ativo]
  );

  const { data, isLoading, isError } = useQuery(
    ['clientes-list', queryParams],
    async () => {
      const response = await api.get('/clientes', {
        params: { page: 1, limit: 50, ...queryParams },
      });
      return response.data;
    }
  );

  const clientes = data?.clientes || (Array.isArray(data) ? data : []);

  const saveMutation = useMutation(
    async (payload) => {
      if (payload.id) {
        const response = await api.put(`/clientes/${payload.id}`, payload);
        return response.data;
      }
      const response = await api.post('/clientes', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clientes-list');
        setForm(initialForm);
        toast.success('Cliente salvo com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao salvar cliente');
      },
    }
  );

  const inactivateMutation = useMutation(
    async (id) => {
      await api.delete(`/clientes/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clientes-list');
        toast.success('Cliente inativado com sucesso');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Falha ao inativar cliente');
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
      razao_social: item.razao_social || '',
      cnpj: item.cnpj || '',
      email: item.email || '',
      telefone: item.telefone || '',
      endereco: item.endereco || '',
      cidade: item.cidade || '',
      estado: item.estado || '',
      cep: item.cep || '',
      observacoes: item.observacoes || '',
      ativo: Boolean(item.ativo),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate({
      id: form.id,
      nome: form.nome.trim(),
      razao_social: form.razao_social.trim() || null,
      cnpj: form.cnpj.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      endereco: form.endereco.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim() || null,
      cep: form.cep.trim() || null,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciar Clientes
      </Typography>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              id="clientes-busca"
              name="busca"
              fullWidth
              label="Buscar por nome, razão social, CNPJ ou e-mail"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              id="clientes-ativo"
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
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Formulário de criação/edição */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {form.id ? 'Editar Cliente' : 'Novo Cliente'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id="cliente-nome"
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
                id="cliente-razao-social"
                name="razao_social"
                fullWidth
                label="Razão Social"
                value={form.razao_social}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="cliente-cnpj"
                name="cnpj"
                fullWidth
                label="CNPJ"
                value={form.cnpj}
                onChange={handleFormChange}
                inputProps={{ maxLength: 18 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="cliente-email"
                name="email"
                fullWidth
                label="E-mail"
                type="email"
                value={form.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="cliente-telefone"
                name="telefone"
                fullWidth
                label="Telefone"
                value={form.telefone}
                onChange={handleFormChange}
                inputProps={{ maxLength: 20 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="cliente-endereco"
                name="endereco"
                fullWidth
                label="Endereço"
                value={form.endereco}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                id="cliente-cidade"
                name="cidade"
                fullWidth
                label="Cidade"
                value={form.cidade}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                id="cliente-estado"
                name="estado"
                fullWidth
                label="UF"
                value={form.estado}
                onChange={handleFormChange}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                id="cliente-cep"
                name="cep"
                fullWidth
                label="CEP"
                value={form.cep}
                onChange={handleFormChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                id="cliente-ativo"
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
              <TextField
                id="cliente-observacoes"
                name="observacoes"
                fullWidth
                multiline
                minRows={2}
                label="Observações"
                value={form.observacoes}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setForm(initialForm)}>
                  Limpar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saveMutation.isLoading}
                >
                  {saveMutation.isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Tabela */}
      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isError ? (
          <Alert severity="error">Não foi possível carregar os clientes.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Razão Social</TableCell>
                  <TableCell>CNPJ</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Cidade/UF</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.razao_social || '-'}</TableCell>
                    <TableCell>{item.cnpj || '-'}</TableCell>
                    <TableCell>{item.email || '-'}</TableCell>
                    <TableCell>{item.telefone || '-'}</TableCell>
                    <TableCell>
                      {[item.cidade, item.estado].filter(Boolean).join('/') || '-'}
                    </TableCell>
                    <TableCell>{item.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEdit(item)}
                        >
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
                {!clientes.length && (
                  <TableRow>
                    <TableCell colSpan={8}>Nenhum cliente encontrado.</TableCell>
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

export default ListarClientes;
