import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { Cita, guardarCitas, obtenerCitas } from '@/services/citas-storage';
import { cancelarRecordatorio, programarRecordatorio } from '@/services/notificaciones';

const TIPOS_CITA = [
  { valor: 'Consulta general', emoji: '🩺' },
  { valor: 'Control', emoji: '💚' },
  { valor: 'Emergencia', emoji: '🚨' },
  { valor: 'Otro', emoji: '✨' },
];
const HORARIOS = [
  { valor: 'Mañana', emoji: '🌅', hora: '8:00' },
  { valor: 'Tarde', emoji: '☀️', hora: '14:00' },
  { valor: 'Noche', emoji: '🌙', hora: '19:00' },
];

const COLORES = {
  primario: '#5B4CFF',
  primarioOscuro: '#2A1E8F',
  primarioClaro: '#EEEBFF',
  rosa: '#FF5C93',
  amarillo: '#FFC83D',
  menta: '#2DD4A7',
  texto: '#1B1740',
  textoSuave: '#7A7799',
  fondo: '#F4F2FF',
  borde: '#E2DEFA',
  error: '#E5484D',
};

type CampoProps = TextInputProps & {
  icono: string;
  etiqueta: string;
  error?: string;
};

function Campo({ icono, etiqueta, error, style, ...props }: CampoProps) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View
        style={[
          styles.inputContenedor,
          enfocado && styles.inputEnfocado,
          !!error && styles.inputError,
        ]}
      >
        <Text style={styles.inputIcono}>{icono}</Text>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#A9A6C4"
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          {...props}
        />
      </View>
      {error ? <Text style={styles.textoError}>⚠️ {error}</Text> : null}
    </View>
  );
}

function Seccion({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaCabecera}>
        <View style={styles.numero}>
          <Text style={styles.textoNumero}>{numero}</Text>
        </View>
        <Text style={styles.tituloSeccion}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

export default function App() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [horario, setHorario] = useState('');
  const [tipoCita, setTipoCita] = useState('');
  const [motivo, setMotivo] = useState('');

  const [fotoUri, setFotoUri] = useState('');
  const [citas, setCitas] = useState<Cita[]>([]);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [exito, setExito] = useState(false);

  // Almacenamiento local: recupera las citas guardadas al abrir la app
  useEffect(() => {
    obtenerCitas().then(setCitas);
  }, []);

  const completados = [nombre, correo, telefono, fecha, horario, tipoCita, motivo].filter((v) =>
    v.trim()
  ).length;
  const progreso = completados / 7;

  const avisarPermisoDenegado = (recurso: string) => {
    Alert.alert(
      'Permiso necesario',
      `Activa el permiso de ${recurso} en los ajustes para usar esta opción.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      avisarPermisoDenegado('la cámara');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  };

  const elegirDeGaleria = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  };

  const eliminarCita = async (cita: Cita) => {
    await cancelarRecordatorio(cita.notificacionId);
    const restantes = citas.filter((c) => c.id !== cita.id);
    setCitas(restantes);
    await guardarCitas(restantes);
  };

  const limpiarCampo = (campo: string) => {
    if (errores[campo]) {
      const copia = { ...errores };
      delete copia[campo];
      setErrores(copia);
    }
  };

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 letras.';
    }

    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio.';
    } else if (!correo.includes('@')) {
      nuevosErrores.correo = 'El correo debe contener un @.';
    }

    if (!telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio.';
    } else if (!/^\d{7,9}$/.test(telefono.trim())) {
      nuevosErrores.telefono = 'Ingresa un teléfono válido (7 a 9 dígitos).';
    }

    if (!fecha.trim()) {
      nuevosErrores.fecha = 'La fecha es obligatoria.';
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha.trim())) {
      nuevosErrores.fecha = 'Usa el formato dd/mm/aaaa.';
    }

    if (!horario) {
      nuevosErrores.horario = 'Selecciona un horario.';
    }

    if (!tipoCita) {
      nuevosErrores.tipoCita = 'Selecciona el tipo de cita.';
    }

    if (!motivo.trim()) {
      nuevosErrores.motivo = 'El motivo es obligatorio.';
    } else if (motivo.trim().length < 5) {
      nuevosErrores.motivo = 'Describe el motivo con un poco más de detalle.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleReservar = async () => {
    setExito(false);
    const esValido = validar();
    if (!esValido) return;

    const notificacionId = await programarRecordatorio(
      nombre.trim(),
      tipoCita,
      fecha.trim(),
      horario
    ).catch(() => undefined);

    const nueva: Cita = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      fecha: fecha.trim(),
      horario,
      tipoCita,
      motivo: motivo.trim(),
      fotoUri: fotoUri || undefined,
      notificacionId,
    };
    const actualizadas = [nueva, ...citas];
    setCitas(actualizadas);
    await guardarCitas(actualizadas);
    setExito(true);
  };

  const handleLimpiar = () => {
    setNombre('');
    setCorreo('');
    setTelefono('');
    setFecha('');
    setHorario('');
    setTipoCita('');
    setMotivo('');
    setFotoUri('');
    setErrores({});
    setExito(false);
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.primarioOscuro} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Cabecera */}
        <View style={styles.cabecera}>
          <View style={[styles.burbuja, styles.burbujaUno]} />
          <View style={[styles.burbuja, styles.burbujaDos]} />
          <View style={[styles.burbuja, styles.burbujaTres]} />
          <Text style={styles.insignia}>✨ AGENDA EN 1 MINUTO</Text>
          <Text style={styles.encabezado}>Reserva tu cita 📅</Text>
          <Text style={styles.subtitulo}>
            Llena los datos, adjunta una foto si quieres y te avisamos con un recordatorio.
          </Text>
          <View style={styles.progresoPista}>
            <View style={[styles.progresoRelleno, { width: `${progreso * 100}%` }]} />
          </View>
          <Text style={styles.progresoTexto}>
            {completados === 7 ? '¡Todo listo! 🎉' : `${completados} de 7 campos completados`}
          </Text>
        </View>

        <View style={styles.cuerpo}>
          <Seccion numero={1} titulo="Tus datos">
            <Campo
              icono="👤"
              etiqueta="Nombre completo"
              placeholder="Ej. María Pérez"
              value={nombre}
              error={errores.nombre}
              onChangeText={(texto) => {
                setNombre(texto);
                limpiarCampo('nombre');
              }}
            />
            <Campo
              icono="✉️"
              etiqueta="Correo electrónico"
              placeholder="Ej. maria@correo.com"
              value={correo}
              error={errores.correo}
              onChangeText={(texto) => {
                setCorreo(texto);
                limpiarCampo('correo');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Campo
              icono="📱"
              etiqueta="Teléfono"
              placeholder="Ej. 987654321"
              value={telefono}
              error={errores.telefono}
              onChangeText={(texto) => {
                setTelefono(texto.replace(/[^0-9]/g, ''));
                limpiarCampo('telefono');
              }}
              keyboardType="number-pad"
              maxLength={9}
            />
          </Seccion>

          <Seccion numero={2} titulo="¿Cuándo te viene bien?">
            <Campo
              icono="🗓️"
              etiqueta="Fecha deseada"
              placeholder="dd/mm/aaaa"
              value={fecha}
              error={errores.fecha}
              onChangeText={(texto) => {
                setFecha(texto);
                limpiarCampo('fecha');
              }}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.etiqueta}>Horario preferido</Text>
            <View style={styles.filaTarjetas}>
              {HORARIOS.map((item) => {
                const activo = horario === item.valor;
                return (
                  <Pressable
                    key={item.valor}
                    style={[styles.opcion, activo && styles.opcionActiva]}
                    onPress={() => {
                      setHorario(item.valor);
                      limpiarCampo('horario');
                    }}
                  >
                    <Text style={styles.opcionEmoji}>{item.emoji}</Text>
                    <Text style={[styles.opcionTitulo, activo && styles.opcionTextoActivo]}>
                      {item.valor}
                    </Text>
                    <Text style={[styles.opcionSub, activo && styles.opcionSubActivo]}>
                      {item.hora}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errores.horario ? <Text style={styles.textoError}>⚠️ {errores.horario}</Text> : null}
          </Seccion>

          <Seccion numero={3} titulo="Cuéntanos tu caso">
            <Text style={styles.etiqueta}>Tipo de cita</Text>
            <View style={styles.filaChips}>
              {TIPOS_CITA.map((item) => {
                const activo = tipoCita === item.valor;
                return (
                  <Pressable
                    key={item.valor}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => {
                      setTipoCita(item.valor);
                      limpiarCampo('tipoCita');
                    }}
                  >
                    <Text style={[styles.textoChip, activo && styles.textoChipActivo]}>
                      {item.emoji} {item.valor}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errores.tipoCita ? (
              <Text style={styles.textoError}>⚠️ {errores.tipoCita}</Text>
            ) : null}

            <View style={styles.separador} />

            <Campo
              icono="📝"
              etiqueta="Motivo de la cita"
              placeholder="Cuéntanos brevemente el motivo"
              value={motivo}
              error={errores.motivo}
              onChangeText={(texto) => {
                setMotivo(texto);
                limpiarCampo('motivo');
              }}
              multiline
              numberOfLines={3}
              style={styles.inputMultilinea}
            />
          </Seccion>

          <Seccion numero={4} titulo="Foto (opcional)">
            {fotoUri ? (
              <View>
                <Image source={{ uri: fotoUri }} style={styles.foto} />
                <Pressable style={styles.botonQuitarFoto} onPress={() => setFotoUri('')}>
                  <Text style={styles.textoQuitarFoto}>✕ Quitar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.zonaVacia}>
                <View style={styles.circuloIcono}>
                  <Text style={styles.iconoGrande}>📸</Text>
                </View>
                <Text style={styles.tituloZona}>Agrega una foto</Text>
                <Text style={styles.subtituloZona}>
                  Una imagen ayuda al especialista a entender tu caso
                </Text>
              </View>
            )}
            <View style={styles.filaAccionesFoto}>
              <Pressable
                style={({ pressed }) => [
                  styles.botonFoto,
                  styles.botonFotoPrimario,
                  pressed && styles.presionado,
                ]}
                onPress={tomarFoto}
              >
                <Text style={styles.textoBotonFotoPrimario}>📷  Tomar foto</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.botonFoto,
                  styles.botonFotoSecundario,
                  pressed && styles.presionado,
                ]}
                onPress={elegirDeGaleria}
              >
                <Text style={styles.textoBotonFotoSecundario}>🖼️  Galería</Text>
              </Pressable>
            </View>
          </Seccion>

          <Pressable
            style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
            onPress={handleReservar}
          >
            <Text style={styles.textoBoton}>🚀  Reservar cita</Text>
          </Pressable>

          <Pressable style={styles.botonSecundario} onPress={handleLimpiar}>
            <Text style={styles.textoBotonSecundario}>Limpiar formulario</Text>
          </Pressable>

          {exito ? (
            <View style={styles.mensajeExito}>
              <Text style={styles.emojiExito}>🎉</Text>
              <Text style={styles.tituloExito}>¡Cita reservada!</Text>
              <Text style={styles.textoExito}>
                {tipoCita} el {fecha} ({horario}).{'\n'}Te enviaremos un recordatorio. 🔔
              </Text>
            </View>
          ) : null}

          {citas.length > 0 ? (
            <View style={styles.seccionCitas}>
              <Text style={styles.tituloLista}>🗂️ Mis citas guardadas</Text>
              {citas.map((cita) => (
                <View key={cita.id} style={styles.tarjetaCita}>
                  {cita.fotoUri ? (
                    <Image source={{ uri: cita.fotoUri }} style={styles.miniatura} />
                  ) : (
                    <View style={[styles.miniatura, styles.miniaturaVacia]}>
                      <Text style={styles.miniaturaEmoji}>📅</Text>
                    </View>
                  )}
                  <View style={styles.tarjetaTexto}>
                    <Text style={styles.tarjetaTitulo}>{cita.tipoCita}</Text>
                    <Text style={styles.tarjetaDetalle}>
                      {cita.nombre} · {cita.fecha} ({cita.horario})
                    </Text>
                    <Text style={styles.tarjetaDetalle} numberOfLines={1}>
                      {cita.motivo}
                    </Text>
                  </View>
                  <Pressable style={styles.botonEliminar} onPress={() => eliminarCita(cita)}>
                    <Text style={styles.textoEliminar}>🗑️</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  scroll: {
    paddingBottom: 56,
  },

  // Cabecera
  cabecera: {
    backgroundColor: COLORES.primario,
    paddingTop: Platform.OS === 'web' ? 110 : 40,
    paddingHorizontal: 24,
    paddingBottom: 56,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  burbuja: {
    position: 'absolute',
    borderRadius: 999,
  },
  burbujaUno: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -70,
    right: -60,
  },
  burbujaDos: {
    width: 120,
    height: 120,
    backgroundColor: COLORES.rosa,
    opacity: 0.55,
    bottom: -40,
    left: -30,
  },
  burbujaTres: {
    width: 56,
    height: 56,
    backgroundColor: COLORES.amarillo,
    opacity: 0.85,
    top: 60,
    right: 40,
  },
  insignia: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  encabezado: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 420,
  },
  progresoPista: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progresoRelleno: {
    height: '100%',
    backgroundColor: COLORES.amarillo,
    borderRadius: 6,
  },
  progresoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  // Cuerpo
  cuerpo: {
    paddingHorizontal: 20,
    marginTop: -28,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    shadowColor: COLORES.primario,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORES.rosa,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumero: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.texto,
  },

  // Campos
  campo: {
    marginBottom: 14,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: 7,
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputEnfocado: {
    borderColor: COLORES.primario,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: COLORES.error,
    backgroundColor: '#FFF3F3',
  },
  inputIcono: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORES.texto,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMultilinea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  textoError: {
    color: COLORES.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: 16,
  },

  // Horarios
  filaTarjetas: {
    flexDirection: 'row',
    gap: 10,
  },
  opcion: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORES.fondo,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opcionActiva: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primarioOscuro,
  },
  opcionEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  opcionTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORES.texto,
  },
  opcionSub: {
    fontSize: 11,
    color: COLORES.textoSuave,
    marginTop: 2,
  },
  opcionTextoActivo: {
    color: '#FFFFFF',
  },
  opcionSubActivo: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Tipo de cita
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORES.fondo,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActivo: {
    backgroundColor: COLORES.primarioClaro,
    borderColor: COLORES.primario,
  },
  textoChip: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.texto,
  },
  textoChipActivo: {
    color: COLORES.primarioOscuro,
    fontWeight: '800',
  },

  // Foto
  zonaVacia: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BDB6FF',
    backgroundColor: COLORES.primarioClaro,
  },
  circuloIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DAD5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconoGrande: {
    fontSize: 30,
  },
  tituloZona: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORES.primarioOscuro,
  },
  subtituloZona: {
    fontSize: 12,
    color: COLORES.textoSuave,
    textAlign: 'center',
    marginTop: 4,
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  botonQuitarFoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(27,23,64,0.75)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoQuitarFoto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filaAccionesFoto: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  botonFoto: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonFotoPrimario: {
    backgroundColor: COLORES.primario,
  },
  botonFotoSecundario: {
    backgroundColor: COLORES.primarioClaro,
    borderWidth: 1,
    borderColor: '#C9C2FF',
  },
  textoBotonFotoPrimario: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  textoBotonFotoSecundario: {
    color: COLORES.primarioOscuro,
    fontWeight: '800',
    fontSize: 14,
  },

  // Botones principales
  boton: {
    backgroundColor: COLORES.rosa,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORES.rosa,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  presionado: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  botonSecundario: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  textoBotonSecundario: {
    color: COLORES.textoSuave,
    fontSize: 14,
    fontWeight: '600',
  },

  // Éxito
  mensajeExito: {
    backgroundColor: '#E6FBF4',
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: COLORES.menta,
    alignItems: 'center',
  },
  emojiExito: {
    fontSize: 40,
  },
  tituloExito: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B7A5C',
    marginTop: 4,
  },
  textoExito: {
    color: '#0B7A5C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 6,
  },

  // Lista de citas
  seccionCitas: {
    marginTop: 28,
  },
  tituloLista: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORES.texto,
    marginBottom: 12,
  },
  tarjetaCita: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderLeftWidth: 5,
    borderLeftColor: COLORES.rosa,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: COLORES.primario,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  miniatura: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  miniaturaVacia: {
    backgroundColor: COLORES.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniaturaEmoji: {
    fontSize: 24,
  },
  tarjetaTexto: {
    flex: 1,
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORES.texto,
  },
  tarjetaDetalle: {
    fontSize: 12,
    color: COLORES.textoSuave,
    marginTop: 2,
  },
  botonEliminar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoEliminar: {
    fontSize: 16,
  },
});
