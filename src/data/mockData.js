export const doctors = [
  {
    id: 1,
    name: 'Dra. Ana López',
    specialty: 'Cardiología',
    status: 'Disponible',
    image: 'https://i.pravatar.cc/150?img=1',
    experience: '12 años de experiencia',
    description: 'La Dra. Martínez es una cardióloga pediátrica dedicada con una vasta experiencia en el diagnóstico y tratamiento de afecciones cardíacas en niños, desde recién nacidos hasta adolescentes. Su enfoque es centrado en el paciente y su familia, brindando atención compasiva y de alta calidad.',
    pendingAppointments: 5,
    nextAvailable: 'Mañana, 09:00 AM',
    services: [
      'Electrocardiograma Pediátrico',
      'Ecocardiorgama Fetal',
      'Consulta de Arritmias',
      'Seguimiento Post-operatorio',
      'Evaluación Pre-deportiva'
    ],
    consultHistory: [
      { patient: 'Diego Rodríguez', date: '22/10/2023', type: 'Consulta de Seguimiento' },
      { patient: 'Ana López', date: '15/09/2023', type: 'Primera Consulta' },
      { patient: 'Carlos Gómez', date: '01/09/2023', type: 'Revisión Anual' }
    ]
  },
  {
    id: 2,
    name: 'Dr. Carlos García',
    specialty: 'Pediatría',
    status: 'Ocupado',
    image: 'https://i.pravatar.cc/150?img=12',
    experience: '8 años de experiencia',
    description: 'Especialista en pediatría general con enfoque en desarrollo infantil.',
    pendingAppointments: 3,
    nextAvailable: 'Hoy, 15:00 PM',
    services: ['Consulta General', 'Vacunación', 'Control de Niño Sano'],
    consultHistory: []
  },
  {
    id: 3,
    name: 'Dra. Elena García',
    specialty: 'Dermatología',
    status: 'Ausente',
    image: 'https://i.pravatar.cc/150?img=5',
    experience: '15 años de experiencia',
    description: 'Dermatóloga especializada en tratamientos estéticos y médicos.',
    pendingAppointments: 0,
    nextAvailable: 'Lunes, 10:00 AM',
    services: ['Consulta Dermatológica', 'Tratamiento de Acné', 'Cirugía Menor'],
    consultHistory: []
  },
  {
    id: 4,
    name: 'Dr. Miguel Torres',
    specialty: 'Oftalmología',
    status: 'Disponible',
    image: 'https://i.pravatar.cc/150?img=13',
    experience: '10 años de experiencia',
    description: 'Oftalmólogo con especialización en cirugía refractiva.',
    pendingAppointments: 2,
    nextAvailable: 'Hoy, 16:30 PM',
    services: ['Examen Visual', 'Cirugía Láser', 'Tratamiento de Cataratas'],
    consultHistory: []
  }
];

export const patients = [
  {
    id: 1,
    name: 'Sofía Martínez',
    image: 'https://i.pravatar.cc/150?img=9',
    lastVisit: '12/03/2024',
    status: 'Activo',
    patientId: 'PT-001-2023',
    birthDate: '01/01/1990',
    firstName: 'Sofía',
    lastName: 'Martínez',
    dni: '12345678X',
    gender: 'Femenino',
    phone: '+34 600 123 4',
    email: 'sofia.martinez@example.com',
    type: 'Adulto',
    allergies: 'Penicilina, polen.',
    appointments: [
      { date: '2024-03-10 - 10:00 AM', type: 'Consulta General', doctor: 'Dr. Juan Pérez' },
      { date: '2024-02-15 - 03:30 PM', type: 'Revisión Anual', doctor: 'Dra. Ana López' },
      { date: '2024-01-20 - 11:00 AM', type: 'Chequeo de Rutina', doctor: 'Dr. Juan Pérez' }
    ],
    documents: [
      { name: 'Informe Radiología.pdf', date: '2024-03-05' },
      { name: 'Resultados Análisis.png', date: '2024-02-28' },
      { name: 'Consentimiento.docx', date: '2024-02-10' }
    ]
  },
  {
    id: 2,
    name: 'Juan Pérez',
    image: 'https://i.pravatar.cc/150?img=11',
    lastVisit: '05/04/2024',
    status: 'Pendiente',
    patientId: 'PT-002-2023',
    birthDate: '15/05/1985',
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '87654321Y',
    gender: 'Masculino',
    phone: '+34 600 456 7',
    email: 'juan.perez@example.com',
    type: 'Adulto',
    allergies: 'Ninguna conocida.',
    appointments: [],
    documents: []
  },
  {
    id: 3,
    name: 'Valeria Gómez',
    image: 'https://i.pravatar.cc/150?img=10',
    lastVisit: '28/02/2024',
    status: 'Activo',
    patientId: 'PT-003-2023',
    birthDate: '20/08/2015',
    firstName: 'Valeria',
    lastName: 'Gómez',
    dni: '45678912Z',
    gender: 'Femenino',
    phone: '+34 600 789 0',
    email: 'valeria.gomez@example.com',
    type: 'Pediátrico',
    allergies: 'Lactosa.',
    appointments: [],
    documents: []
  },
  {
    id: 4,
    name: 'Carlos Sánchez',
    image: 'https://i.pravatar.cc/150?img=14',
    lastVisit: '20/03/2024',
    status: 'Inactivo',
    patientId: 'PT-004-2023',
    birthDate: '10/12/1978',
    firstName: 'Carlos',
    lastName: 'Sánchez',
    dni: '78945612A',
    gender: 'Masculino',
    phone: '+34 600 234 5',
    email: 'carlos.sanchez@example.com',
    type: 'Adulto',
    allergies: 'Ninguna.',
    appointments: [],
    documents: []
  },
  {
    id: 5,
    name: 'Elena Díaz',
    image: 'https://i.pravatar.cc/150?img=16',
    lastVisit: '18/04/2024',
    status: 'Activo',
    patientId: 'PT-005-2023',
    birthDate: '25/03/1992',
    firstName: 'Elena',
    lastName: 'Díaz',
    dni: '32165498B',
    gender: 'Femenino',
    phone: '+34 600 567 8',
    email: 'elena.diaz@example.com',
    type: 'Adulto',
    allergies: 'Mariscos.',
    appointments: [],
    documents: []
  },
  {
    id: 6,
    name: 'Mateo Rojas',
    image: 'https://i.pravatar.cc/150?img=15',
    lastVisit: '01/04/2024',
    status: 'Activo',
    patientId: 'PT-006-2023',
    birthDate: '05/06/2018',
    firstName: 'Mateo',
    lastName: 'Rojas',
    dni: '65498732C',
    gender: 'Masculino',
    phone: '+34 600 890 1',
    email: 'mateo.rojas@example.com',
    type: 'Pediátrico',
    allergies: 'Ninguna.',
    appointments: [],
    documents: []
  }
];

export const appointments = [
  {
    id: 1,
    time: '09:00 AM',
    patient: 'Sofía Martínez',
    type: 'Consulta General',
    doctor: 'Dra. Ana López',
    status: 'Confirmada',
    date: '2025-12-11',
    duration: 30,
    services: [
      { id: 1, name: 'Consulta General', price: 300, duration: 30 }
    ]
  },
  {
    id: 2,
    time: '10:30 AM',
    patient: 'Juan Pérez',
    type: 'Examen de Rutina',
    doctor: 'Dr. Carlos García',
    status: 'Pendiente',
    date: '2022-11-12',
    duration: 45,
    services: [
      { id: 1, name: 'Consulta General', price: 300, duration: 30 },
      { id: 2, name: 'Vacunación', price: 150, duration: 15 }
    ]
  },
  {
    id: 3,
    time: '11:45 AM',
    patient: 'María Rodríguez',
    type: 'Revisión Dermatológica',
    doctor: 'Dra. Laura Soto',
    status: 'Confirmada',
    date: '2025-12-10',
    duration: 30,
    services: [
      { id: 1, name: 'Consulta Dermatológica', price: 400, duration: 30 }
    ]
  },
  {
    id: 4,
    time: '01:00 PM',
    patient: 'Pedro Gómez',
    type: 'Fisioterapia',
    doctor: 'Lic. Miguel Torres',
    status: 'Reprogramada',
    date: '2025-12-10',
    duration: 60,
    services: [
      { id: 1, name: 'Fisioterapia', price: 500, duration: 60 }
    ]
  },
  {
    id: 5,
    time: '02:30 PM',
    patient: 'Laura Fernández',
    type: 'Control Pediátrico',
    doctor: 'Dra. Ana López',
    status: 'Confirmada',
    date: '2025-12-11',
    duration: 30,
    services: [
      { id: 1, name: 'Control de Niño Sano', price: 350, duration: 30 }
    ]
  },
  {
    id: 6,
    time: '04:00 PM',
    patient: 'Manuel Castro',
    type: 'Vacunación',
    doctor: 'Dr. Carlos García',
    status: 'Pendiente',
    date: '2025-12-11',
    duration: 15,
    services: [
      { id: 2, name: 'Vacunación', price: 150, duration: 15 }
    ]
  },
  {
    id: 7,
    time: '05:15 PM',
    patient: 'Isabel Díaz',
    type: 'Consulta de Nutrición',
    doctor: 'Lic. Sara Ruiz',
    status: 'Cancelada',
    date: '2025-12-10',
    duration: 45,
    services: [
      { id: 1, name: 'Consulta de Nutrición', price: 350, duration: 45 }
    ]
  },
  {
    id: 8,
    time: '08:00 AM',
    patient: 'Roberto Sánchez',
    type: 'Chequeo General',
    doctor: 'Dr. Carlos García',
    status: 'Completada',
    date: '2025-12-11',
    duration: 30,
    services: [
      { id: 1, name: 'Consulta General', price: 300, duration: 30 }
    ]
  },
  {
    id: 9,
    time: '09:30 AM',
    patient: 'Carmen López',
    type: 'Revisión Cardiológica',
    doctor: 'Dra. Ana López',
    status: 'Confirmada',
    date: '2025-12-11',
    duration: 45,
    services: [
      { id: 1, name: 'Electrocardiograma Pediátrico', price: 350, duration: 30 },
      { id: 3, name: 'Consulta de Arritmias', price: 500, duration: 15 }
    ]
  },
  {
    id: 10,
    time: '11:00 AM',
    patient: 'Fernando Ruiz',
    type: 'Consulta Dermatológica',
    doctor: 'Dra. Elena García',
    status: 'Pendiente',
    date: '2025-12-11',
    duration: 30,
    services: [
      { id: 1, name: 'Consulta Dermatológica', price: 400, duration: 30 }
    ]
  }
];

export const upcomingAppointments = [
  {
    id: 1,
    time: '10:00 AM',
    date: 'hoy, 23 feb',
    patient: 'Sofía Martínez',
    doctor: 'Dr. López'
  },
  {
    id: 2,
    time: '11:30 AM',
    date: 'hoy, 23 feb',
    patient: 'Carlos García',
    doctor: 'Dra. Elena'
  },
  {
    id: 3,
    time: '02:00 PM',
    date: 'mañana, 24 feb',
    patient: 'Isabella Pérez',
    doctor: 'Dr. Morales'
  },
  {
    id: 4,
    time: '03:45 PM',
    date: 'mañana, 24 feb',
    patient: 'Diego Rodríguez',
    doctor: 'Dra. María'
  }
];

export const reportData = {
  totalAppointments: 1234,
  totalAppointmentsChange: '+20.1% del mes pasado',
  adultPatients: 890,
  adultPatientsChange: '+15.3% del mes pasado',
  pediatricPatients: 344,
  pediatricPatientsChange: '+25.7% del mes pasado',
  appointmentsByMonth: [
    { month: 'Enero', value: 250 },
    { month: 'Febrero', value: 310 },
    { month: 'Marzo', value: 280 },
    { month: 'Abril', value: 340 },
    { month: 'Mayo', value: 380 }
  ],
  serviceRevenue: [
    { name: 'General', value: 35, color: '#33A9FF' },
    { name: 'Odontología', value: 25, color: '#FF6B9D' },
    { name: 'Pediatría', value: 20, color: '#FFA726' },
    { name: 'Dermatología', value: 20, color: '#9C27B0' }
  ]
};
