/**
 * Mapa de `auth/<error.code>` do Firebase Auth → mensagem PT-BR amigável.
 * Cobre os códigos mais comuns no fluxo de login/cadastro por e-mail/senha.
 * Referência: https://firebase.google.com/docs/auth/admin/errors
 */

const MENSAGENS = {
  // Login
  'auth/invalid-email':          'E-mail inválido.',
  'auth/user-disabled':          'Esta conta foi desativada.',
  'auth/user-not-found':         'Não existe conta com este e-mail.',
  'auth/wrong-password':         'Senha incorreta.',
  'auth/invalid-credential':     'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed':  'Operação não permitida. Verifique se o método de login está habilitado no Firebase.',

  // Cadastro
  'auth/email-already-in-use':        'Este e-mail já está cadastrado. Tente fazer login.',
  'auth/weak-password':               'Senha muito fraca. Use ao menos 6 caracteres e combine letras e números.',
  'auth/missing-email':               'Informe um e-mail.',
  'auth/missing-password':            'Informe uma senha.',
  'auth/account-exists-with-different-credential':
    'Já existe uma conta com este e-mail usando outro método de login.',
}

const MENSAGEM_DESCONHECIDA = 'Erro de autenticação. Tente novamente.'

export function traduzirErroAuth(errorOrCode) {
  if (!errorOrCode) return MENSAGEM_DESCONHECIDA

  // Recebe string (já extraído) ou Error (lançado pelo Firebase)
  const code = typeof errorOrCode === 'string' ? errorOrCode : errorOrCode?.code
  if (!code) return MENSAGEM_DESCONHECIDA

  return MENSAGENS[code] || MENSAGEM_DESCONHECIDA
}
