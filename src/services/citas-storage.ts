import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'citas_guardadas';

export type Cita = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  fecha: string;
  horario: string;
  tipoCita: string;
  motivo: string;
  fotoUri?: string;
  notificacionId?: string;
};

export async function obtenerCitas(): Promise<Cita[]> {
  try {
    const json = await AsyncStorage.getItem(CLAVE);
    return json ? (JSON.parse(json) as Cita[]) : [];
  } catch {
    return [];
  }
}

export async function guardarCitas(citas: Cita[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(citas));
}
