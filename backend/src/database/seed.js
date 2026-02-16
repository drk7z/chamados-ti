require('dotenv').config();

const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const {
  sequelize,
  Entidade,
  Role,
  User,
  UserRole,
  ConfiguracaoSistema,
  Cliente,
  Unidade,
  Departamento,
  CentroCusto,
  ChamadoTipo
} = require('../models');

const ROLE_DEFINITIONS = [
  { nome: 'Administrador', nivel: 1, descricao: 'Administrador global do sistema' },
  { nome: 'Gestor', nivel: 2, descricao: 'Gestor da operação e da entidade' },
  { nome: 'Tecnico', nivel: 3, descricao: 'Técnico de atendimento' },
  { nome: 'Solicitante', nivel: 4, descricao: 'Usuário solicitante' },
  { nome: 'Auditor', nivel: 5, descricao: 'Perfil de auditoria e leitura' }
];

const getOrCreateEntidadeDefault = async () => {
  const nomeEntidade = process.env.DEFAULT_ENTIDADE_NOME || 'Empresa Padrão';

  let entidade = await Entidade.findOne({
    where: { nome: nomeEntidade },
    paranoid: false
  });

  if (!entidade) {
    entidade = await Entidade.create({
      nome: nomeEntidade,
      razao_social: process.env.DEFAULT_ENTIDADE_RAZAO_SOCIAL || nomeEntidade,
      cnpj: process.env.DEFAULT_ENTIDADE_CNPJ || null,
      email: process.env.DEFAULT_ENTIDADE_EMAIL || null,
      telefone: process.env.DEFAULT_ENTIDADE_TELEFONE || null,
      ativo: true
    });
    logger.info(`🌱 Entidade criada: ${entidade.nome}`);
  } else {
    if (entidade.deletedAt) {
      await entidade.restore();
    }
    if (!entidade.ativo) {
      await entidade.update({ ativo: true });
    }
    logger.info(`🌱 Entidade já existente: ${entidade.nome}`);
  }

  return entidade;
};

const ensureRoles = async () => {
  const roles = {};

  for (const roleDef of ROLE_DEFINITIONS) {
    let role = await Role.findOne({
      where: { nome: roleDef.nome },
      paranoid: false
    });

    if (!role) {
      role = await Role.create({
        nome: roleDef.nome,
        nivel: roleDef.nivel,
        descricao: roleDef.descricao,
        ativo: true
      });
      logger.info(`🌱 Role criada: ${role.nome}`);
    } else {
      const updates = {};
      if (role.deletedAt) updates.deleted_at = null;
      if (!role.ativo) updates.ativo = true;
      if (role.nivel !== roleDef.nivel) updates.nivel = roleDef.nivel;
      if (role.descricao !== roleDef.descricao) updates.descricao = roleDef.descricao;

      if (Object.keys(updates).length > 0) {
        if (role.deletedAt) {
          await role.restore();
          delete updates.deleted_at;
        }
        await role.update(updates);
      }

      logger.info(`🌱 Role já existente: ${role.nome}`);
    }

    roles[roleDef.nome] = role;
  }

  return roles;
};

const ensureAdminUser = async (entidadeId) => {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin';
  const adminNome = process.env.DEFAULT_ADMIN_NOME || 'Administrador';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
  const senhaHash = await bcrypt.hash(adminPassword, 10);

  let admin = await User.findOne({
    where: { email: adminEmail },
    paranoid: false
  });

  if (!admin) {
    admin = await User.create({
      nome: adminNome,
      email: adminEmail,
      senha: adminPassword,
      ativo: true,
      tentativas_login: 0,
      entidade_id: entidadeId
    });

    logger.info(`🌱 Usuário admin criado: ${admin.email}`);
  } else {
    if (admin.deletedAt) {
      await admin.restore();
    }

    await admin.update({
      nome: adminNome,
      ativo: true,
      tentativas_login: 0,
      bloqueado_ate: null,
      entidade_id: admin.entidade_id || entidadeId,
      senha: senhaHash
    }, { hooks: false });

    logger.info(`🌱 Usuário admin já existente/atualizado: ${admin.email}`);
  }

  return admin;
};

const ensureAdminRoleLink = async (userId, roleId) => {
  const existing = await UserRole.findOne({
    where: { user_id: userId, role_id: roleId }
  });

  if (!existing) {
    await UserRole.create({
      user_id: userId,
      role_id: roleId,
      ativo: true
    });
    logger.info('🌱 Vínculo admin -> role Administrador criado');
    return;
  }

  if (!existing.ativo) {
    await existing.update({ ativo: true });
  }

  logger.info('🌱 Vínculo admin -> role Administrador já existente');
};

const upsertConfiguracao = async ({ chave, valor, tipo = 'string', categoria = 'geral', descricao = null }) => {
  const existente = await ConfiguracaoSistema.findOne({ where: { chave } });

  if (!existente) {
    await ConfiguracaoSistema.create({
      chave,
      valor: valor !== null && valor !== undefined ? String(valor) : null,
      tipo,
      categoria,
      descricao,
      editavel: true
    });
    return;
  }

  await existente.update({
    valor: valor !== null && valor !== undefined ? String(valor) : null,
    tipo,
    categoria,
    descricao
  });
};

const ensureTenantConfigs = async (entidadeId) => {
  await upsertConfiguracao({
    chave: 'global:sistema_nome',
    valor: 'Chamados TI',
    categoria: 'sistema',
    descricao: 'Nome padrão do sistema'
  });

  await upsertConfiguracao({
    chave: 'global:sistema_versao',
    valor: '1.1.0',
    categoria: 'sistema',
    descricao: 'Versão funcional atual'
  });

  await upsertConfiguracao({
    chave: `tenant:${entidadeId}:timezone`,
    valor: process.env.TIMEZONE || 'America/Sao_Paulo',
    categoria: 'geral',
    descricao: 'Fuso horário da entidade'
  });

  await upsertConfiguracao({
    chave: `tenant:${entidadeId}:smtp_host`,
    valor: process.env.SMTP_HOST || null,
    categoria: 'email',
    descricao: 'Servidor SMTP da entidade'
  });

  await upsertConfiguracao({
    chave: `tenant:${entidadeId}:smtp_port`,
    valor: process.env.SMTP_PORT || null,
    tipo: 'number',
    categoria: 'email',
    descricao: 'Porta SMTP da entidade'
  });

  logger.info('🌱 Configurações base por tenant aplicadas');
};

const ensureOrganizationalBase = async (entidadeId) => {
  const clienteNome = process.env.DEFAULT_CLIENTE_NOME || 'Cliente Padrão';
  const unidadeNome = process.env.DEFAULT_UNIDADE_NOME || 'Matriz';
  const departamentoNome = process.env.DEFAULT_DEPARTAMENTO_NOME || 'TI';
  const centroCustoNome = process.env.DEFAULT_CENTRO_CUSTO_NOME || 'Operações TI';

  let cliente = await Cliente.findOne({
    where: { nome: clienteNome, entidade_id: entidadeId },
    paranoid: false
  });

  if (!cliente) {
    cliente = await Cliente.create({
      nome: clienteNome,
      ativo: true,
      entidade_id: entidadeId
    });
    logger.info(`🌱 Cliente base criado: ${cliente.nome}`);
  } else {
    if (cliente.deletedAt) await cliente.restore();
    if (!cliente.ativo) await cliente.update({ ativo: true });
  }

  let unidade = await Unidade.findOne({
    where: { cliente_id: cliente.id, nome: unidadeNome },
    paranoid: false
  });

  if (!unidade) {
    unidade = await Unidade.create({
      cliente_id: cliente.id,
      nome: unidadeNome,
      codigo: process.env.DEFAULT_UNIDADE_CODIGO || 'UN-BASE',
      ativo: true
    });
    logger.info(`🌱 Unidade base criada: ${unidade.nome}`);
  } else {
    if (unidade.deletedAt) await unidade.restore();
    if (!unidade.ativo) await unidade.update({ ativo: true });
  }

  let departamento = await Departamento.findOne({
    where: { unidade_id: unidade.id, nome: departamentoNome },
    paranoid: false
  });

  if (!departamento) {
    departamento = await Departamento.create({
      unidade_id: unidade.id,
      nome: departamentoNome,
      codigo: process.env.DEFAULT_DEPARTAMENTO_CODIGO || 'DP-TI',
      ativo: true
    });
    logger.info(`🌱 Departamento base criado: ${departamento.nome}`);
  } else {
    if (departamento.deletedAt) await departamento.restore();
    if (!departamento.ativo) await departamento.update({ ativo: true });
  }

  let centroCusto = await CentroCusto.findOne({
    where: { departamento_id: departamento.id, nome: centroCustoNome },
    paranoid: false
  });

  if (!centroCusto) {
    centroCusto = await CentroCusto.create({
      departamento_id: departamento.id,
      nome: centroCustoNome,
      codigo: process.env.DEFAULT_CENTRO_CUSTO_CODIGO || 'CC-TI',
      ativo: true
    });
    logger.info(`🌱 Centro de custo base criado: ${centroCusto.nome}`);
  } else {
    if (centroCusto.deletedAt) await centroCusto.restore();
    if (!centroCusto.ativo) await centroCusto.update({ ativo: true });
  }
};

const ensureChamadoBase = async () => {
  const tipoNome = process.env.DEFAULT_CHAMADO_TIPO_NOME || 'Suporte Geral';

  let tipo = await ChamadoTipo.findOne({
    where: { nome: tipoNome },
    paranoid: false
  });

  if (!tipo) {
    tipo = await ChamadoTipo.create({
      nome: tipoNome,
      descricao: 'Tipo base para abertura inicial de chamados',
      requer_aprovacao: false,
      ativo: true,
      ordem: 1
    });
    logger.info(`🌱 Tipo de chamado base criado: ${tipo.nome}`);
  } else {
    if (tipo.deletedAt) await tipo.restore();
    if (!tipo.ativo) await tipo.update({ ativo: true });
  }
};

const run = async () => {
  try {
    await sequelize.authenticate();
    logger.info('🌱 Iniciando seed de tenant/base...');

    const entidade = await getOrCreateEntidadeDefault();
    const roles = await ensureRoles();
    const admin = await ensureAdminUser(entidade.id);

    await ensureAdminRoleLink(admin.id, roles.Administrador.id);
    await ensureTenantConfigs(entidade.id);
    await ensureOrganizationalBase(entidade.id);
    await ensureChamadoBase();

    logger.info('✅ Seed executado com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
};

run();
