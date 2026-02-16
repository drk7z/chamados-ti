const { body, validationResult } = require('express-validator');

const loginValidation = [
  body('email')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Usuário é obrigatório')
    .isLength({ max: 255 })
    .withMessage('Usuário inválido'),
  body('senha')
    .isString()
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha inválida')
];

const alterarSenhaValidation = [
  body('senha_atual')
    .isString()
    .notEmpty()
    .withMessage('Senha atual é obrigatória')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha atual inválida'),
  body('senha_nova')
    .isString()
    .notEmpty()
    .withMessage('Nova senha é obrigatória')
    .isLength({ min: 10, max: 128 })
    .withMessage('Nova senha deve ter no mínimo 10 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula')
    .matches(/[0-9]/)
    .withMessage('Nova senha deve conter pelo menos um número')
    .custom((value, { req }) => value !== req.body.senha_atual)
    .withMessage('Nova senha deve ser diferente da senha atual')
];

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Dados inválidos',
    detalhes: result.array().map((item) => ({
      campo: item.path,
      mensagem: item.msg
    }))
  });
};

module.exports = {
  loginValidation,
  alterarSenhaValidation,
  validate
};
