const jwt = require('jsonwebtoken');
const { User, Role, Entidade } = require('../../models');
const logger = require('../../utils/logger');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          error: 'Usuário e senha são obrigatórios' 
        });
      }

      // Buscar usuário
      const user = await User.findOne({ 
        where: { email },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [], paranoid: false }
        }, {
          model: Entidade,
          as: 'entidade'
        }]
      });

      if (!user) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        });
      }

      // Verificar se está ativo
      if (!user.ativo) {
        return res.status(403).json({ 
          error: 'Usuário inativo. Contate o administrador.' 
        });
      }

      // Verificar bloqueio
      if (user.bloqueado_ate && new Date() < user.bloqueado_ate) {
        return res.status(403).json({ 
          error: 'Usuário bloqueado temporariamente. Tente novamente mais tarde.' 
        });
      }

      // Validar senha
      const senhaValida = await user.validarSenha(senha);

      if (!senhaValida) {
        // Incrementar tentativas
        user.tentativas_login += 1;

        // Bloquear após 5 tentativas
        if (user.tentativas_login >= 5) {
          user.bloqueado_ate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        }

        await user.save();

        return res.status(401).json({ 
          error: 'Credenciais inválidas',
          tentativas_restantes: 5 - user.tentativas_login
        });
      }

      // Resetar tentativas
      user.tentativas_login = 0;
      user.bloqueado_ate = null;
      user.ultimo_acesso = new Date();
      await user.save();

      // Gerar token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          entidade_id: user.entidade_id || null,
          roles: user.roles.map(r => r.nome)
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      logger.info(`Login bem-sucedido: ${user.email}`);

      res.json({
        token,
        user: user.toJSON(),
        roles: user.roles
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [], paranoid: false }
        }, {
          model: Entidade,
          as: 'entidade'
        }]
      });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email,
          entidade_id: req.user.entidade_id || null,
          roles: req.user.roles.map(r => r.nome)
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({ token });
    } catch (error) {
      next(error);
    }
  }

  async alterarSenha(req, res, next) {
    try {
      const { senha_atual, senha_nova } = req.body;
      const user = await User.findByPk(req.user.id);

      // Validar senha atual
      const senhaValida = await user.validarSenha(senha_atual);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual inválida' });
      }

      // Atualizar senha
      user.senha = senha_nova;
      await user.save();

      logger.info(`Senha alterada: ${user.email}`);

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
