import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
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

function MeusChamados() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery('meus-chamados-page', async () => {
    const response = await api.get('/home/meus-chamados');
    return response.data;
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Meus Chamados
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Não foi possível carregar seus chamados.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Técnico</TableCell>
                  <TableCell>Criado em</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data || []).map((item) => (
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
                    <TableCell>{item.tecnico_responsavel?.nome || 'Não atribuído'}</TableCell>
                    <TableCell>
                      {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum chamado encontrado.
                    </TableCell>
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

export default MeusChamados;
