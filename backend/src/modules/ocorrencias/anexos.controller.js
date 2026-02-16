const { ChamadoAnexo, Chamado, User } = require('../../models');
const path = require('path');
const fs = require('fs').promises;

class AnexoController {
  async upload(req, res) {
    try {
      const { id: chamado_id } = req.params;

      // Verificar se chamado existe
      const chamadoWhere = { id: chamado_id };
      if (req.tenantId) chamadoWhere.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where: chamadoWhere });
      if (!chamado) {
        return res.status(404).json({
          success: false,
          message: 'Chamado não encontrado'
        });
      }

      // Verificar se arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
      }

      // Salvar informações do anexo no banco
      const anexo = await ChamadoAnexo.create({
        chamado_id,
        usuario_id: req.user.id,
        nome_arquivo: req.file.originalname,
        caminho_arquivo: req.file.path,
        tamanho_bytes: req.file.size,
        tipo_mime: req.file.mimetype,
        descricao: req.body.descricao || null
      });

      res.status(201).json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        data: anexo
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: error.message
      });
    }
  }

  async list(req, res) {
    try {
      const { id: chamado_id } = req.params;

      const chamadoWhere = { id: chamado_id };
      if (req.tenantId) chamadoWhere.entidade_id = req.tenantId;

      const chamado = await Chamado.findOne({ where: chamadoWhere });
      if (!chamado) {
        return res.status(404).json({
          success: false,
          message: 'Chamado não encontrado'
        });
      }

      const anexos = await ChamadoAnexo.findAll({
        where: { chamado_id },
        include: [
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nome']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: anexos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar anexos',
        error: error.message
      });
    }
  }

  async download(req, res) {
    try {
      const { id } = req.params;

      const anexo = await ChamadoAnexo.findByPk(id, {
        include: [{ model: Chamado, as: 'chamado', attributes: ['id', 'entidade_id'] }]
      });
      if (!anexo) {
        return res.status(404).json({
          success: false,
          message: 'Anexo não encontrado'
        });
      }

      if (req.tenantId && anexo.chamado?.entidade_id !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este anexo'
        });
      }

      // Verificar se arquivo existe
      try {
        await fs.access(anexo.caminho_arquivo);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado no sistema de arquivos'
        });
      }

      // Fazer download
      res.download(anexo.caminho_arquivo, anexo.nome_arquivo);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer download do arquivo',
        error: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const anexo = await ChamadoAnexo.findByPk(id, {
        include: [{ model: Chamado, as: 'chamado', attributes: ['id', 'entidade_id'] }]
      });
      if (!anexo) {
        return res.status(404).json({
          success: false,
          message: 'Anexo não encontrado'
        });
      }

      if (req.tenantId && anexo.chamado?.entidade_id !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para remover este anexo'
        });
      }

      // Verificar permissão (apenas quem enviou ou admin pode deletar)
      const isAdmin = req.user.roles?.some(role => role.nivel <= 2);
      if (!isAdmin && anexo.usuario_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para deletar este anexo'
        });
      }

      // Deletar arquivo físico
      try {
        await fs.unlink(anexo.caminho_arquivo);
      } catch (error) {
        console.error('Erro ao deletar arquivo físico:', error);
        // Continua mesmo se falhar ao deletar o arquivo
      }

      // Deletar registro do banco
      await anexo.destroy();

      res.json({
        success: true,
        message: 'Anexo removido com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar anexo',
        error: error.message
      });
    }
  }
}

module.exports = new AnexoController();
