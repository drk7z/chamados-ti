const jwt = require('jsonwebtoken');
const { User, Role, Permission, RolePermission } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'roles',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [], paranoid: false }
        }]
      }]
    });

    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    // Adicionar usuário e permissões ao request
    req.user = user;
    req.permissions = [];
    
    if (user.roles) {
      user.roles.forEach(role => {
        if (role.permissions) {
          req.permissions.push(...role.permissions);
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }

    return res.status(500).json({ error: 'Erro ao validar autenticação' });
  }
};

const authorize = (modulo, recurso, acao) => {
  return (req, res, next) => {
    const hasPermission = req.permissions.some(
      p => p.modulo === modulo && p.recurso === recurso && p.acao === acao
    );

    if (!hasPermission) {
      // Verificar se é admin (nível 1)
      const isAdmin = req.user.roles?.some(role => role.nivel === 1);
      
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Sem permissão para realizar esta ação',
          required: { modulo, recurso, acao }
        });
      }
    }

    next();
  };
};

module.exports = { authenticate, authorize };
