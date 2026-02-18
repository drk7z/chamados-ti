const NORMALIZATION_MAP = {
  'CrÃ­tica': 'Crítica',
  'MÃ©dia': 'Média',
  'MÃ©dio': 'Médio',
  'NÃ£o': 'Não',
  'AÃ§Ã£o': 'Ação',
  'ConfiguraÃ§Ã£o': 'Configuração'
};

export const normalizePtBrText = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  let normalized = value;

  Object.entries(NORMALIZATION_MAP).forEach(([broken, fixed]) => {
    normalized = normalized.split(broken).join(fixed);
  });

  return normalized;
};
