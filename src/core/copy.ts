/**
 * Visible UI copy in Spanish. `locale` controls date and number formatting.
 */
export const copy = {
  panelLabel: 'Panel de emergencia',
  close: 'Cerrar panel de emergencia',
  back: 'Volver',
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
  abortSuccessTitle: 'Emergencia Abortada',
  abortSuccessText: 'Tus contactos han sido notificados.',
  abortErrorTitle: 'No pudimos abortar la emergencia',
  abortErrorText: 'Vuelve a intentarlo.',

  simulate: 'Prueba',
  simulateConfirmTitle: 'Enviar mensaje de prueba',
  simulateConfirmText:
    'Se enviará un mensaje de prueba a tus contactos. No se crea una emergencia real.',
  simulateConfirm: 'Sí, enviar prueba',
  simulateCancel: 'Cancelar',
  simulateResultOk: '¡Prueba de simulación iniciada con éxito!',
  simulateResultFail: 'No se pudo enviar el mensaje de prueba.',
  simulateSuccessTitle: '¡Prueba Enviada!',
  simulateSuccessText:
    'Tus contactos recibirán la invitación a formar parte de tu grupo de apoyo.',
  simulatePartialTitle: 'Prueba enviada parcialmente',
  simulatePartialText:
    'Algunos contactos no han recibido el mensaje aún. Verifica que sus números de contacto sean correctos.',
  simulateErrorTitle: 'No pudimos enviar la prueba',
  simulateErrorText: 'Revisa tu conexión y vuelve a intentarlo.',
  simulateCreditsTitle: 'Sin créditos suficientes',
  simulateCreditsText: 'Recarga tu saldo para enviar tus mensajes de prueba.',

  feedbackDismiss: 'Entendido',

  retry: 'Reintentar',

  geolocationDeniedTitle: 'No tenemos permiso para la ubicación',
  geolocationDeniedText:
    'Habilita el acceso a la ubicación en tu navegador y vuelve a intentarlo.',
  geolocationTimeoutTitle: 'La ubicación ha tardado en responder',
  geolocationTimeoutText:
    'Asegúrate de que tengas activado el GPS con buena señal e intenta de nuevo.',
  geolocationUnsupportedTitle:
    'Este dispositivo no puede compartir la ubicación',
  geolocationUnsupportedText:
    'Usa un navegador compatible y verifica que la ubicación esté disponible. Luego vuelve a intentarlo.',
  geolocationUnavailableTitle: 'No pudimos obtener tu ubicación',
  geolocationUnavailableText:
    'Activa el GPS y verifica que la ubicación esté permitida; luego vuelve a intentarlo.',

  activationErrorTitle: 'No pudimos activar la emergencia',
  activationErrorText: 'Revisa tu conexión y vuelve a intentarlo.',
  activationErrorRetryText: 'Vuelve a intentarlo.',
  activationCreditsTitle: 'Sin créditos disponibles',
  activationCreditsText:
    'La alerta será activada, pero las alertas llegarán una vez hayas recargado nuevamente.',
  activationContactsTitle: 'Sin contactos de apoyo',
  activationContactsText:
    'Selecciona a través de tu ficha médica, tus contactos de emergencia.',
  activationProfileTitle: 'Falta tu perfil médico',
  activationProfileText:
    'Complétalo en tu perfil o llama directamente a la línea de emergencia.',
  activationValidationTitle: 'Revisa tus datos',
  activationValidationText:
    'Verifica tu número de teléfono y vuelve a intentarlo.',
  activationWhatsappTitle: 'No pudimos avisar a tus contactos',
  activationWhatsappText:
    'Llama directamente a la línea de emergencia y avisa a tus contactos por otro medio.',
  activationSessionTitle: 'Tu sesión ya no es válida',
  activationSessionText:
    'Cierra y vuelve a abrir el panel; si persiste, llama directamente a la línea de emergencia.',
  activationNotFoundTitle: 'El servicio de emergencia no está disponible',
  activationNotFoundText: 'Llama directamente a la línea de emergencia.',

  serviceUnavailableTitle: 'Servicio no disponible',
  serviceUnavailableText:
    'El equipo ha sido notificado del problema y el servicio será restablecido en breve.',
  sessionInvalidTitle: 'Sesión inválida',
  sessionInvalidText: 'Refresca la página e inténtalo de nuevo.',
  rateLimitedTitle: 'Demasiados intentos',
  rateLimitedText: 'Espera unos segundos y vuelve a intentarlo.',

  errorInvalidCodeTitle: 'Código no válido',
  errorInvalidCodeText:
    'Verifica el enlace o código de acceso e inténtalo de nuevo.',
  errorInactiveCodeTitle: 'Código inactivo',
  errorInactiveCodeText:
    'Comunícate con el equipo de soporte para reactivar tu acceso.',
  errorNetworkTitle: 'No pudimos conectar',
  errorNetworkText: 'Revisa tu conexión e inténtalo de nuevo.',
  errorGenericTitle: 'No pudimos completar la operación',
  errorGenericText: 'Vuelve a intentarlo.',

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
  insufficientCredits:
    'No hay créditos suficientes para enviar la alerta de emergencia. Comunícate directamente con la línea de emergencia.',
  respondersEmpty: 'Aún no hay contactos notificados.',
} as const;
