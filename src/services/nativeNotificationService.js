// NativeNotificationService — ponte entre o sistema de alertas in-app
// e o cordova-plugin-local-notification para notificações nativas do celular.
//
// Funciona em dois modos:
//   1. Cordova (Android): usa cordova-plugin-local-notification
//   2. Browser (npm run dev): fallback silencioso (sem notificação nativa)

const isCordova = typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.notification

function getPlugin() {
  if (isCordova) return cordova.plugins.notification.local
  return null
}

// Verifica se o app tem permissão para notificações (Android 13+)
export async function verificarPermissao() {
  const plugin = getPlugin()
  if (!plugin) return true
  try {
    if (plugin.hasPermission) {
      return await new Promise(resolve => {
        plugin.hasPermission(granted => resolve(granted))
      })
    }
    return true
  } catch {
    return false
  }
}

// Solicita permissão (Android 13+)
export async function solicitarPermissao() {
  const plugin = getPlugin()
  if (!plugin) return true
  try {
    if (plugin.requestPermission) {
      return await new Promise(resolve => {
        plugin.requestPermission(granted => resolve(granted))
      })
    }
    return true
  } catch {
    return false
  }
}

// Agenda uma notificação nativa
// opts: { id, titulo, descricao, nivel, modulo, data }
export function agendar(opts) {
  const plugin = getPlugin()
  if (!plugin) return Promise.resolve()

  const cores = {
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
  }

  return new Promise((resolve) => {
    plugin.schedule({
      id: opts.id || Date.now(),
      title: opts.titulo || 'Propriedade Inteligente',
      text: opts.descricao || '',
      icon: 'res://drawable/icon',
      color: cores[opts.nivel] || '#3498db',
      smallIcon: 'res://drawable/icon',
      foreground: true,
      vibrate: true,
      sound: true,
      data: {
        modulo: opts.modulo || '',
        referencia_uuid: opts.referencia_uuid || '',
      },
    }, () => resolve(), () => resolve())
  })
}

// Cancela uma notificação por ID
export function cancelar(id) {
  const plugin = getPlugin()
  if (!plugin) return Promise.resolve()
  return new Promise((resolve) => {
    plugin.cancel(id, () => resolve(), () => resolve())
  })
}

// Cancela todas as notificações
export function cancelarTodas() {
  const plugin = getPlugin()
  if (!plugin) return Promise.resolve()
  return new Promise((resolve) => {
    plugin.cancelAll(() => resolve(), () => resolve())
  })
}

// Retorna notificações agendadas
export function listarAgendadas() {
  const plugin = getPlugin()
  if (!plugin) return Promise.resolve([])
  return new Promise((resolve) => {
    plugin.getScheduled(notifs => resolve(notifs || []), () => resolve([]))
  })
}

// Gera um ID numérico estável a partir de uma string (tipo::referencia)
// para evitar duplicatas de notificações nativas
export function gerarIdNotificacao(tipo, referenciaUuid) {
  const str = `${tipo}::${referenciaUuid || ''}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}
