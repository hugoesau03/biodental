# Dr. Desk - Sistema de Gestión Médica

## 📋 Descripción

Dr. Desk es una aplicación web móvil completa para la gestión de consultorios médicos, desarrollada con React.js puro, styled-components y React Router. La aplicación está optimizada para dispositivos móviles y tablets con un diseño responsivo y moderno.

## ✨ Características Principales

### 🏠 Página de Inicio
- Dashboard con resumen del día
- Acciones rápidas (Reservar Cita, Registrar Paciente, Ver Reportes, Mis Médicos)
- Filtros de citas
- Lista de próximas citas
- Notificaciones

### 📅 Agenda
- Calendario interactivo mensual
- Vista por día/semana/detallada
- Lista de citas con estados (Confirmada, Pendiente, Reprogramada, Cancelada)
- Filtros por médico y estado
- Botón flotante para crear nueva cita

### 👨‍⚕️ Médicos
- Lista de médicos con foto y especialidad
- Estados: Disponible, Ocupado, Ausente
- Acciones: Ver Agenda, Bloquear Horarios, Editar Servicios
- Perfil detallado de cada médico con:
  - Información profesional
  - Agenda del día
  - Historial de consultas
  - Servicios ofrecidos

### 👥 Pacientes
- Búsqueda de pacientes
- Filtros: Todos, Adultos, Pediátricos
- Estados: Activo, Pendiente, Inactivo
- Perfil completo del paciente con:
  - Datos personales
  - Historial de citas
  - Formularios clínicos
  - Documentos adjuntos

### 📊 Reportes
- Métricas clave (Citas Totales, Pacientes Adultos, Pacientes Pediátricos)
- Gráfico de barras: Citas por período
- Gráfico circular: Ingresos por servicio
- Filtros por fecha y médico
- Exportación a PDF y CSV

### 📝 Formularios
- **Reservar Cita**: Formulario completo para agendar citas
- **Registro de Paciente**: Formulario detallado con:
  - Datos personales
  - Tipo de paciente (Adulto/Pediátrico)
  - Historial de salud (Alergias, Medicamentos)
  - Carga de documentos

## 🛠️ Tecnologías Utilizadas

- **React 19.2.1** - Framework principal
- **React Router DOM** - Navegación entre páginas
- **Styled Components** - Estilos CSS-in-JS
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos modernos

## 📱 Diseño Responsivo

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

## 🎨 Sistema de Diseño

### Colores
- **Primary**: #33A9FF (Azul)
- **Success**: #4CAF50 (Verde)
- **Warning**: #FFA726 (Amarillo)
- **Danger**: #F44336 (Rojo)
- **Background**: #F8F9FA (Gris claro)

### Tipografía
- Font Family: System fonts (San Francisco, Segoe UI, Roboto)
- Tamaños: 12px - 32px
- Pesos: 400, 500, 600, 700

## 📂 Estructura del Proyecto

```
src/
├── components/
│   └── Layout/
│       ├── BottomNavigation.js    # Navegación inferior
│       ├── Header.js               # Encabezado de páginas
│       └── FloatingButton.js       # Botón flotante de acción
├── pages/
│   ├── Inicio.js                   # Página principal
│   ├── Agenda.js                   # Calendario y citas
│   ├── Medicos.js                  # Lista de médicos
│   ├── Pacientes.js                # Lista de pacientes
│   ├── Reportes.js                 # Reportes y estadísticas
│   ├── PerfilMedico.js            # Perfil del médico
│   ├── PerfilPaciente.js          # Perfil del paciente
│   ├── ReservarCita.js            # Formulario de cita
│   └── RegistroPaciente.js        # Formulario de registro
├── styles/
│   ├── GlobalStyles.js             # Estilos globales
│   └── theme.js                    # Tema y variables
├── data/
│   └── mockData.js                 # Datos de ejemplo
└── App.js                          # Componente principal
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js 14+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
cd drdesk

# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
```

La aplicación se abrirá en `http://localhost:3000`

### Scripts Disponibles

```bash
npm start       # Inicia el servidor de desarrollo
npm build       # Crea la versión de producción
npm test        # Ejecuta las pruebas
```

## 🧭 Navegación

La aplicación cuenta con una barra de navegación inferior fija con 5 secciones:

1. **Inicio** - Dashboard principal
2. **Agenda** - Calendario y citas
3. **Pacientes** - Gestión de pacientes
4. **Médicos** - Gestión de médicos
5. **Reportes** - Estadísticas y reportes

## 📊 Datos de Ejemplo

La aplicación incluye datos mock para demostración:
- 4 médicos con diferentes especialidades
- 6 pacientes (adultos y pediátricos)
- 7 citas con diferentes estados
- Métricas y gráficos de ejemplo

## 🎯 Características Destacadas

### Mobile-First
- Diseño optimizado para móviles
- Navegación táctil intuitiva
- Componentes adaptables

### Interactividad
- Transiciones suaves
- Feedback visual en acciones
- Estados hover y active

### Accesibilidad
- Contraste de colores adecuado
- Tamaños de fuente legibles
- Áreas de toque apropiadas

## 🔄 Próximas Mejoras

- [ ] Integración con backend/API
- [ ] Autenticación de usuarios
- [ ] Notificaciones push
- [ ] Modo oscuro
- [ ] Sincronización offline
- [ ] Exportación de reportes real
- [ ] Chat entre médico-paciente
- [ ] Videoconsultas

## 👨‍💻 Desarrollo

### Agregar Nueva Página

1. Crear componente en `src/pages/`
2. Agregar ruta en `src/App.js`
3. Actualizar navegación si es necesario

### Agregar Nuevos Datos

Editar `src/data/mockData.js` para agregar o modificar datos de ejemplo.

### Personalizar Tema

Modificar `src/styles/theme.js` para cambiar colores, fuentes, espaciados, etc.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para preguntas o soporte, por favor abre un issue en el repositorio.

---

**Desarrollado con ❤️ usando React.js**
