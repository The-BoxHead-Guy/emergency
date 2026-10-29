/**
 * Visible UI copy in Spanish. `locale` controls date and number formatting.
 */
export const copy = {
  panelLabel: 'Panel de emergencia',
  close: 'Cerrar panel de emergencia',
  question: '¿Tiene usted una emergencia?',
  illustrationAlt: 'Ícono paramédico',
  emergency: 'Emergencia',
  emergencyAria: 'Botón de emergencia',
  test: 'Prueba',
  testAria: 'Botón de simulación de emergencia',

  statusTitle: 'Estado de Respuestas de Emergencia',
  responderColumn: 'Respondedor',
  sentColumn: 'Enviado',
  deliveredColumn: 'Recibido',
  readColumn: 'Leído',
  refresh: 'Actualizar',
  refreshing: 'Actualizando...',
  loading: 'Cargando…',
  statusPrefix: 'Estado:',
  statusPending: 'Pendiente',
  statusSent: 'Enviado',
  statusDelivered: 'Recibido',
  statusRead: 'Leído',
  statusFailed: 'Fallido',

  abort: 'Abortar Aviso de Emergencia',
  abortConfirmTitle: 'Confirmar aborto de emergencia',
  abortConfirmText:
    'Estas apunto de abortar la emergencia, esta acción es irreversible ¿Desea continuar?',
  abortConfirm: 'Si, abortar',
  abortCancel: 'No, continuar',
  abortResultOk:
    'Emergencia abortada con éxito, tus contactos han sido notificados',
  abortResultFail: 'No se pudo abortar la emergencia. Inténtalo de nuevo.',
  abortSuccessTitle: '¡Emergencia Abortada Con Éxito!',
  abortSuccessDetails: 'Tus contactos han sido notificados',

  simulate: 'Prueba',
  simulateConfirmTitle: 'Enviar mensaje de prueba',
  simulateConfirmText:
    'Se enviará un mensaje de prueba a tus contactos. No se crea una emergencia real.',
  simulateConfirm: 'Sí, enviar prueba',
  simulateCancel: 'Cancelar',
  simulateResultOk: '¡Prueba de simulación iniciada con éxito!',
  simulateResultFail: 'No se pudo enviar el mensaje de prueba.',
  simulateSuccessTitle: '¡Éxito!',
  simulateSuccessDetails: 'Mensajes enviados',
  simulateSuccessCompleted: 'Proceso completado',

  feedbackDismiss: 'Entendido',

  errorTitle: 'Error',
  errorText: 'Ha ocurrido un error inesperado.',
  errorDetailInfo: 'Revisa la información requerida',
  errorDetailRetry: 'Intenta nuevamente',
  retry: 'Reintentar',

  geolocationTitle: 'No pudimos obtener tu ubicación',
  geolocationDenied:
    'Permiso de ubicación denegado. Activa el permiso o llama directamente.',
  geolocationUnavailable:
    'Tu ubicación no está disponible en este momento. Llama directamente.',
  geolocationTimeout:
    'La ubicación tardó demasiado. Inténtalo de nuevo o llama directamente.',
  geolocationUnsupported:
    'Este dispositivo no permite compartir la ubicación. Llama directamente.',
  fallbackTitle: 'Llama directamente',
  fallbackDescription:
    'Si no puedes completar la emergencia desde aquí, llama a este número.',
  fallbackCall: 'Llamar',

  resumeTitle: 'Emergencia Activa Detectada',
  resumeDescription:
    'Se ha detectado una emergencia activa en el sistema. Por favor, revisa el estado de la emergencia inmediatamente.',
  resumeAction: 'Abrir Panel de Emergencia',

  partialFailure:
    'Algunos contactos no pudieron ser notificados. Revisa la lista.',
  simulatedBanner: 'Mensaje de prueba: no hay una emergencia real activa.',
  activeBanner: 'Emergencia activa. Tus contactos fueron notificados.',
  emergencyActiveError:
    'Ya tienes una emergencia activa. Revisa el estado antes de continuar.',
  respondersEmpty: 'Aún no hay contactos notificados.',
} as const;
