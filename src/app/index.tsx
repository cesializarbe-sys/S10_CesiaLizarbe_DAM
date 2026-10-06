import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';

const TIPOS_CITA = ['Consulta general', 'Control', 'Emergencia', 'Otro'];
const HORARIOS = ['Mañana', 'Tarde', 'Noche'];

export default function App() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [horario, setHorario] = useState('');
  const [tipoCita, setTipoCita] = useState('');
  const [motivo, setMotivo] = useState('');

  const [errores, setErrores] = useState({});
  const [exito, setExito] = useState(false);

  const limpiarCampo = (campo) => {
    if (errores[campo]) {
      const copia = { ...errores };
      delete copia[campo];
      setErrores(copia);
    }
  };

  const validar = () => {
    const nuevosErrores = {};

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

  const handleReservar = () => {
    setExito(false);
    const esValido = validar();
    if (esValido) {
      setExito(true);
    }
  };

  const handleLimpiar = () => {
    setNombre('');
    setCorreo('');
    setTelefono('');
    setFecha('');
    setHorario('');
    setTipoCita('');
    setMotivo('');
    setErrores({});
    setExito(false);
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.encabezado}>📅 Reserva de Cita</Text>
        <Text style={styles.subtitulo}>
          Completa todos tus datos para agendar tu cita
        </Text>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Nombre completo</Text>
          <TextInput
            style={[styles.input, errores.nombre && styles.inputError]}
            placeholder="Ej. María Pérez"
            value={nombre}
            onChangeText={(texto) => {
              setNombre(texto);
              limpiarCampo('nombre');
            }}
          />
          {errores.nombre ? (
            <Text style={styles.textoError}>{errores.nombre}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, errores.correo && styles.inputError]}
            placeholder="Ej. maria@correo.com"
            value={correo}
            onChangeText={(texto) => {
              setCorreo(texto);
              limpiarCampo('correo');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errores.correo ? (
            <Text style={styles.textoError}>{errores.correo}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Teléfono</Text>
          <TextInput
            style={[styles.input, errores.telefono && styles.inputError]}
            placeholder="Ej. 987654321"
            value={telefono}
            onChangeText={(texto) => {
              setTelefono(texto.replace(/[^0-9]/g, ''));
              limpiarCampo('telefono');
            }}
            keyboardType="number-pad"
            maxLength={9}
          />
          {errores.telefono ? (
            <Text style={styles.textoError}>{errores.telefono}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Fecha deseada</Text>
          <TextInput
            style={[styles.input, errores.fecha && styles.inputError]}
            placeholder="dd/mm/aaaa"
            value={fecha}
            onChangeText={(texto) => {
              setFecha(texto);
              limpiarCampo('fecha');
            }}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {errores.fecha ? (
            <Text style={styles.textoError}>{errores.fecha}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Horario preferido</Text>
          <View style={styles.filaChips}>
            {HORARIOS.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.chip,
                  horario === item && styles.chipSeleccionado,
                ]}
                onPress={() => {
                  setHorario(item);
                  limpiarCampo('horario');
                }}
              >
                <Text
                  style={[
                    styles.textoChip,
                    horario === item && styles.textoChipSeleccionado,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          {errores.horario ? (
            <Text style={styles.textoError}>{errores.horario}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Tipo de cita</Text>
          <View style={styles.filaChips}>
            {TIPOS_CITA.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.chip,
                  tipoCita === item && styles.chipSeleccionado,
                ]}
                onPress={() => {
                  setTipoCita(item);
                  limpiarCampo('tipoCita');
                }}
              >
                <Text
                  style={[
                    styles.textoChip,
                    tipoCita === item && styles.textoChipSeleccionado,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          {errores.tipoCita ? (
            <Text style={styles.textoError}>{errores.tipoCita}</Text>
          ) : null}
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Motivo de la cita</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultilinea,
              errores.motivo && styles.inputError,
            ]}
            placeholder="Cuéntanos brevemente el motivo"
            value={motivo}
            onChangeText={(texto) => {
              setMotivo(texto);
              limpiarCampo('motivo');
            }}
            multiline
            numberOfLines={3}
          />
          {errores.motivo ? (
            <Text style={styles.textoError}>{errores.motivo}</Text>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.boton,
            pressed && styles.botonPresionado,
          ]}
          onPress={handleReservar}
        >
          <Text style={styles.textoBoton}>Reservar cita</Text>
        </Pressable>

        <Pressable style={styles.botonSecundario} onPress={handleLimpiar}>
          <Text style={styles.textoBotonSecundario}>Limpiar formulario</Text>
        </Pressable>

        {exito ? (
          <View style={styles.mensajeExito}>
            <Text style={styles.textoExito}>
              ✅ Cita reservada correctamente para {nombre}.{'\n'}
              {tipoCita} el {fecha} ({horario}).
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  encabezado: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B6B80',
    marginBottom: 24,
  },
  campo: {
    marginBottom: 18,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2E3A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DBE3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
  },
  inputMultilinea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#E24C4C',
  },
  textoError: {
    color: '#E24C4C',
    fontSize: 12,
    marginTop: 4,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D9DBE3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipSeleccionado: {
    backgroundColor: '#4C5FE2',
    borderColor: '#4C5FE2',
  },
  textoChip: {
    fontSize: 13,
    color: '#2E2E3A',
  },
  textoChipSeleccionado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  boton: {
    backgroundColor: '#4C5FE2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonPresionado: {
    opacity: 0.8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  botonSecundario: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  textoBotonSecundario: {
    color: '#6B6B80',
    fontSize: 14,
    fontWeight: '500',
  },
  mensajeExito: {
    backgroundColor: '#E4F8EC',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4CBE7C',
  },
  textoExito: {
    color: '#1E7D44',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
