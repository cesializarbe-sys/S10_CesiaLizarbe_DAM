import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HORA_POR_HORARIO: Record<string, number> = {
  Mañana: 8,
  Tarde: 14,
  Noche: 19,
};

/** Pide permiso de notificaciones. Devuelve true si fue concedido. */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios de citas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;

  const nuevo = await Notifications.requestPermissionsAsync();
  return nuevo.granted;
}

/**
 * Programa un recordatorio el día de la cita (1 hora antes del bloque horario).
 * Si esa hora ya pasó, avisa en 5 segundos como confirmación inmediata.
 */
export async function programarRecordatorio(
  nombre: string,
  tipoCita: string,
  fecha: string,
  horario: string
): Promise<string | undefined> {
  if (!(await pedirPermisoNotificaciones())) return undefined;

  const [dd, mm, aaaa] = fecha.split('/').map(Number);
  const hora = HORA_POR_HORARIO[horario] ?? 9;
  const momento = new Date(aaaa, mm - 1, dd, hora - 1, 0, 0);

  const content = {
    title: '📅 Recordatorio de cita',
    body: `${nombre}, tienes ${tipoCita.toLowerCase()} hoy (${horario}).`,
  };

  const trigger =
    momento.getTime() > Date.now()
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: momento, channelId: 'default' }
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          channelId: 'default',
        };

  return Notifications.scheduleNotificationAsync({ content, trigger });
}

export async function cancelarRecordatorio(id?: string): Promise<void> {
  if (!id || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id);
}
