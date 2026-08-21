import React, { useState, useEffect } from 'react';

type UserRole = 'SUPER_ADMIN' | 'DIRECTOR' | 'ENTRENADOR';
type Gender = 'FEMENINO' | 'MASCULINO';
type TargetType = 'JUGADORES' | 'ENTRENADORES';
type Period = 'Inicial' | 'Media' | 'Final';
type AttendanceStatus = 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' | 'LESIONADO';
type SessionType = 'ENTRENAMIENTO' | 'PARTIDO';
type Screen = 
  | 'EQUIPOS' 
  | 'PLANTILLA' 
  | 'PASAR_LISTA' 
  | 'LISTA_ENTRENADORES' 
  | 'PANEL_SUPERADMIN'
  | 'EDITOR_RUBRICAS'
  | 'MODAL_QR'
  | 'FORMULARIO' 
  | 'INFORME' 
  | 'INFORME_EQUIPO' 
  | 'MODAL_NUEVO_EQUIPO';

interface LevelOption {
  key: string;
  label: string;
  desc: string;
  color: string;
  weight: number;
}

interface Player {
  id: string;
  nombre: string;
  dorsal: number;
  nacimiento: number;
  tokenPublico: string;
  inicial: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
  media: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
  final: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
}

interface Session {
  id: string;
  fecha: string;
  tipo: SessionType;
  asistencias: Record<string, AttendanceStatus>;
}

interface Coach {
  id: string;
  nombre: string;
  cargo: string;
  equipoNombre: string;
  gender: Gender;
  inicial: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
  media: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
  final: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE';
}

interface Team {
  id: string;
  clubId: string;
  nombre: string;
  categoria: string;
  gender: Gender;
  entrenador: string;
  jugadores: Player[];
  sesiones: Session[];
}

interface Club {
  id: string;
  nombre: string;
  temporada: string;
  logoUrl: string | null;
}

interface AppUser {
  id: string;
  email: string;
  pass: string;
  name: string;
  role: UserRole;
  clubId?: string;
  teamId?: string;
}

interface RubricCategory {
  id: string;
  nombre: string;
  items: string[];
}

const NIVELES_JUGADORES: LevelOption[] = [
  { key: 'EXCELENTE', label: 'Excelente', desc: 'Dominio sobresaliente y constante.', color: '#16A34A', weight: 4 },
  { key: 'CONSOLIDADO', label: 'Consolidado', desc: 'Adquirido y ejecutado con autonomía.', color: '#22C55E', weight: 3 },
  { key: 'EN_DESARROLLO', label: 'En desarrollo', desc: 'En proceso de aprendizaje motriz.', color: '#F59E0B', weight: 2 },
  { key: 'NECESITA_APOYO', label: 'Necesita apoyo', desc: 'Dificultad evidente en la ejecución.', color: '#EF4444', weight: 1 },
  { key: 'NO_OBSERVADO', label: 'No observado', desc: 'Sin datos suficientes de valoración.', color: '#CBD5E1', weight: 0 },
];

const NIVELES_ENTRENADORES: LevelOption[] = [
  { key: 'EXCELENTE', label: 'Excelente', desc: 'Metodología sobresaliente y liderazgo positivo.', color: '#16A34A', weight: 4 },
  { key: 'BUENO', label: 'Bueno', desc: 'Cumple con los estándares formativos del club.', color: '#22C55E', weight: 3 },
  { key: 'MEJORABLE', label: 'Mejorable', desc: 'Aspectos técnicos a optimizar con supervisión.', color: '#F59E0B', weight: 2 },
  { key: 'NECESITA_APOYO', label: 'Necesita apoyo', desc: 'Requiere pautas metodológicas directas.', color: '#EF4444', weight: 1 },
  { key: 'NO_OBSERVADO', label: 'No observado', desc: 'No evaluado en este ciclo.', color: '#CBD5E1', weight: 0 },
];

const RUBRICA_JUGADORES_DEF: RubricCategory[] = [
  {
    id: 'cat_motor',
    nombre: 'Desarrollo motor',
    items: ['Coordinación dinámica', 'Equilibrio y apoyos', 'Velocidad gestual', 'Cambios de dirección', 'Frecuencia de salto']
  },
  {
    id: 'cat_tecnica',
    nombre: 'Técnica individual',
    items: ['Dominio del bote', 'Precisión en el pase', 'Recepción en movimiento', 'Mecánica de tiro', 'Finalizaciones/Entradas', 'Mano no dominante']
  },
  {
    id: 'cat_tactica',
    nombre: 'Comprensión del juego',
    items: ['Ocupación de espacios', 'Juego sin balón', 'Toma de decisiones en 1c1', 'Lectura de ventajas', 'Generosidad colectiva']
  },
  {
    id: 'cat_defensa',
    nombre: 'Defensa y Actitud',
    items: ['Actitud e intensidad', '1c1 al hombre con balón', 'Colocación en lado de ayuda', 'Cierre de rebote', 'Balance defensivo']
  }
];

const RUBRICA_ENTRENADORES_DEF: RubricCategory[] = [
  {
    id: 'cat_coach_comunicacion',
    nombre: 'Comunicación y Clima de Equipo',
    items: ['Claridad y brevedad en consignas', 'Feedback pedagógico y refuerzo positivo', 'Tono de voz y energía en pista', 'Gestión de la frustración del grupo']
  },
  {
    id: 'cat_coach_metodologia',
    nombre: 'Metodología y Dinámica de Sesión',
    items: ['Aprovechamiento del tiempo útil (sin filas)', 'Diseño de tareas acorde a la edad', 'Capacidad de corrección sobre la marcha', 'Ritmo e intensidad de entrenamiento']
  },
  {
    id: 'cat_coach_direccion',
    nombre: 'Dirección de Partido y Competición',
    items: ['Gestión equitativa de minutos/rotaciones', 'Serenidad y control emocional en el banco', 'Instrucciones claras en tiempos muertos', 'Respeto al estamento arbitral y rivales']
  },
  {
    id: 'cat_coach_compromiso',
    nombre: 'Compromiso y Valores de Club',
    items: ['Puntualidad y preparación de material', 'Alineación con la Dirección Técnica', 'Trato profesional con las familias', 'Cuidado y recogida de instalaciones']
  }
];

const CLUBS_INICIALES: Club[] = [
  { id: 'club_doguen', nombre: 'Club Doguen', temporada: '2026/27', logoUrl: null },
  { id: 'club_canarias', nombre: 'CB San Cristóbal', temporada: '2026/27', logoUrl: null }
];

const EQUIPOS_INICIALES: Team[] = [
  {
    id: 't_doguen_1',
    clubId: 'club_doguen',
    nombre: 'Doguen Nuevo Sentimiento',
    categoria: 'Alevín (2014-2015)',
    gender: 'MASCULINO',
    entrenador: 'Carlos Santana',
    jugadores: [
      { id: 'j1', nombre: 'Mateo Álvarez', dorsal: 5, nacimiento: 2015, tokenPublico: 'sec_8f9a2b1c4e7d', inicial: 'COMPLETADA', media: 'PENDIENTE', final: 'PENDIENTE' },
      { id: 'j2', nombre: 'Leo Batista', dorsal: 55, nacimiento: 2014, tokenPublico: 'sec_3c4d5e6f7a8b', inicial: 'COMPLETADA', media: 'PENDIENTE', final: 'PENDIENTE' }
    ],
    sesiones: [
      { id: 's1', fecha: '12/08/2026', tipo: 'ENTRENAMIENTO', asistencias: { 'j1': 'PRESENTE', 'j2': 'PRESENTE' } },
      { id: 's2', fecha: '14/08/2026', tipo: 'ENTRENAMIENTO', asistencias: { 'j1': 'PRESENTE', 'j2': 'FALTA' } },
      { id: 's3', fecha: '17/08/2026', tipo: 'PARTIDO', asistencias: { 'j1': 'PRESENTE', 'j2': 'PRESENTE' } }
    ]
  }
];

const USUARIOS_INICIALES: AppUser[] = [
  { id: 'u1', email: 'admin@plataforma.com', pass: 'admin123', name: 'Administrador Master', role: 'SUPER_ADMIN' },
  { id: 'u2', email: 'director@doguen.com', pass: 'doguen2026', name: 'Dirección Técnica Doguen', role: 'DIRECTOR', clubId: 'club_doguen' },
  { id: 'u3', email: 'carlos@doguen.com', pass: 'carlos123', name: 'Carlos Santana', role: 'ENTRENADOR', clubId: 'club_doguen', teamId: 't_doguen_1' }
];

export default function App() {
  const [publicToken, setPublicToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token');
    }
    return null;
  });

  const [sessionUser, setSessionUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('app_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [clubs, setClubs] = useState<Club[]>(() => {
    const saved = localStorage.getItem('app_multi_clubs');
    return saved ? JSON.parse(saved) : CLUBS_INICIALES;
  });

  const [usuarios, setUsuarios] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('app_users_list');
    return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
  });

  const [rubricasJugadores, setRubricasJugadores] = useState<RubricCategory[]>(() => {
    const saved = localStorage.getItem('app_rubricas_jugadores');
    return saved ? JSON.parse(saved) : RUBRICA_JUGADORES_DEF;
  });

  const [rubricasEntrenadores, setRubricasEntrenadores] = useState<RubricCategory[]>(() => {
    const saved = localStorage.getItem('app_rubricas_entrenadores');
    return saved ? JSON.parse(saved) : RUBRICA_ENTRENADORES_DEF;
  });

  const [pestanaRubrica, setPestanaRubrica] = useState<TargetType>('JUGADORES');
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevoItemTexto, setNuevoItemTexto] = useState<Record<string, string>>({});

  const [clubActivoId, setClubActivoId] = useState<string>(() => {
    return localStorage.getItem('app_active_club_id') || CLUBS_INICIALES[0].id;
  });

  const [equipos, setEquipos] = useState<Team[]>(() => {
    const saved = localStorage.getItem('app_multi_teams');
    return saved ? JSON.parse(saved) : EQUIPOS_INICIALES;
  });

  const [editandoClub, setEditandoClub] = useState(false);
  const [genero, setGenero] = useState<Gender>('MASCULINO');
  const [tipoEvaluacion, setTipoEvaluacion] = useState<TargetType>('JUGADORES');
  const [periodo, setPeriodo] = useState<Period>('Inicial');
  const [pantalla, setPantalla] = useState<Screen>('EQUIPOS');

  // Estado para desplegar los accesos de prueba en la portada
  const [mostrarDemo, setMostrarDemo] = useState(false);

  const [modalConfirmacion, setModalConfirmacion] = useState<{
    tipo: 'ELIMINAR_USUARIO' | 'EDITAR_PASSWORD';
    user: AppUser;
    tempPass?: string;
  } | null>(null);

  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [nuevoUserEmail, setNuevoUserEmail] = useState('');
  const [nuevoUserPass, setNuevoUserPass] = useState('');
  const [nuevoUserNombre, setNuevoUserNombre] = useState('');
  const [nuevoUserRol, setNuevoUserRol] = useState<UserRole>('DIRECTOR');
  const [nuevoUserClubId, setNuevoUserClubId] = useState<string>(CLUBS_INICIALES[0].id);

  const [nuevoClubNombre, setNuevoClubNombre] = useState('');
  const [nuevoClubTemporada, setNuevoClubTemporada] = useState('2026/27');

  const [sessionFecha, setSessionFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionTipo, setSessionTipo] = useState<SessionType>('ENTRENAMIENTO');
  const [sessionAsistencias, setSessionAsistencias] = useState<Record<string, AttendanceStatus>>({});

  const [nuevoNombreEquipo, setNuevoNombreEquipo] = useState('');
  const [nuevaCatEquipo, setNuevaCatEquipo] = useState('');
  const [nuevoEntrenador, setNuevoEntrenador] = useState('');

  const [nuevoNombreJugador, setNuevoNombreJugador] = useState('');
  const [nuevoDorsal, setNuevoDorsal] = useState('');
  const [nuevoNacimiento, setNuevoNacimiento] = useState('');

  const [obsAbiertas, setObsAbiertas] = useState<Record<string, boolean>>({});

  const [respuestas, setRespuestas] = useState<Record<string, { nivel: string; obs: string }>>({
    'Coordinación dinámica': { nivel: 'EN_DESARROLLO', obs: '' },
    'Dominio del bote': { nivel: 'NECESITA_APOYO', obs: '' },
    'Claridad y brevedad en consignas': { nivel: 'EXCELENTE', obs: 'Consignas directas y claras.' },
    'Aprovechamiento del tiempo útil (sin filas)': { nivel: 'BUENO', obs: '' }
  });

  const [fortalezas, setFortalezas] = useState('Excelente actitud, visión táctica y disciplina.');
  const [objetivos, setObjetivos] = useState('Mejora en la mano no dominante y control de ritmo.');
  const [evaluadorNombre, setEvaluadorNombre] = useState('Dirección Técnica');

  const effectiveClubId = sessionUser?.role === 'DIRECTOR' || sessionUser?.role === 'ENTRENADOR'
    ? (sessionUser.clubId || clubActivoId)
    : clubActivoId;

  const clubActivo = clubs.find(c => c.id === effectiveClubId) || clubs[0] || CLUBS_INICIALES[0];

  const equiposDelClub = equipos.filter(e => e.clubId === clubActivo.id);
  const equiposFiltrados = equiposDelClub.filter(e => {
    if (sessionUser?.role === 'ENTRENADOR') {
      const coachName = sessionUser.name ? sessionUser.name.toLowerCase() : '';
      return e.entrenador.toLowerCase().includes(coachName) || (sessionUser.teamId ? e.id === sessionUser.teamId : false);
    }
    return e.gender === genero;
  });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Team>(equiposFiltrados[0] || equiposDelClub[0] || EQUIPOS_INICIALES[0]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Player>(equipoSeleccionado?.jugadores?.[0] || EQUIPOS_INICIALES[0].jugadores[0]);
  const [coachSeleccionado, setCoachSeleccionado] = useState<Coach | null>(null);

  useEffect(() => {
    localStorage.setItem('app_multi_clubs', JSON.stringify(clubs));
    localStorage.setItem('app_multi_teams', JSON.stringify(equipos));
    localStorage.setItem('app_users_list', JSON.stringify(usuarios));
    localStorage.setItem('app_rubricas_jugadores', JSON.stringify(rubricasJugadores));
    localStorage.setItem('app_rubricas_entrenadores', JSON.stringify(rubricasEntrenadores));
    localStorage.setItem('app_active_club_id', clubActivoId);
    if (sessionUser) {
      localStorage.setItem('app_auth_user', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('app_auth_user');
    }
  }, [clubs, equipos, usuarios, rubricasJugadores, rubricasEntrenadores, clubActivoId, sessionUser]);

  useEffect(() => {
    const teams = equipos.filter(e => e.clubId === effectiveClubId);
    if (teams.length > 0) {
      setEquipoSeleccionado(teams[0]);
      if (teams[0].jugadores.length > 0) {
        setJugadorSeleccionado(teams[0].jugadores[0]);
      }
    }
  }, [effectiveClubId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const found = usuarios.find(u => u.email.toLowerCase() === authEmail.trim().toLowerCase());
    
    if (!found) {
      setAuthError('El correo introducido no existe en el sistema.');
      return;
    }

    if (found.pass !== authPass) {
      setAuthError('Contraseña incorrecta.');
      return;
    }

    setSessionUser(found);
    if (found.clubId) setClubActivoId(found.clubId);
    setPantalla(found.role === 'SUPER_ADMIN' ? 'PANEL_SUPERADMIN' : 'EQUIPOS');
  };

  const handleDemoLogin = (role: UserRole) => {
    if (role === 'SUPER_ADMIN') {
      const demoUser = usuarios[0] || USUARIOS_INICIALES[0];
      setSessionUser(demoUser);
      setPantalla('PANEL_SUPERADMIN');
    } else if (role === 'DIRECTOR') {
      const demoUser = usuarios[1] || USUARIOS_INICIALES[1];
      setSessionUser(demoUser);
      setClubActivoId(demoUser.clubId || CLUBS_INICIALES[0].id);
      setPantalla('EQUIPOS');
    } else {
      const demoUser = usuarios[2] || USUARIOS_INICIALES[2];
      setSessionUser(demoUser);
      setClubActivoId(demoUser.clubId || CLUBS_INICIALES[0].id);
      setTipoEvaluacion('JUGADORES');
      const coachTeam = equipos.find(e => e.entrenador.toLowerCase().includes(demoUser.name.toLowerCase()));
      if (coachTeam) setEquipoSeleccionado(coachTeam);
      setPantalla('PLANTILLA');
    }
    setAuthError(null);
  };

  const handleLogout = () => {
    setSessionUser(null);
    setAuthEmail('');
    setAuthPass('');
    setEditandoClub(false);
    setPantalla('EQUIPOS');
  };

  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoUserEmail || !nuevoUserNombre || !nuevoUserPass) {
      alert('Rellena todos los campos.');
      return;
    }

    const nuevoU: AppUser = {
      id: `u_${Date.now()}`,
      email: nuevoUserEmail.trim(),
      pass: nuevoUserPass.trim(),
      name: nuevoUserNombre.trim(),
      role: nuevoUserRol,
      clubId: nuevoUserRol !== 'SUPER_ADMIN' ? nuevoUserClubId : undefined
    };

    setUsuarios([...usuarios, nuevoU]);
    setNuevoUserEmail('');
    setNuevoUserPass('');
    setNuevoUserNombre('');
    alert(`Usuario ${nuevoU.name} creado.`);
  };

  const ejecutarCambioPassword = () => {
    if (!modalConfirmacion || !modalConfirmacion.tempPass) return;
    const { user, tempPass } = modalConfirmacion;
    setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, pass: tempPass.trim() } : u));
    if (sessionUser && sessionUser.id === user.id) {
      setSessionUser({ ...sessionUser, pass: tempPass.trim() });
    }
    setModalConfirmacion(null);
    alert(`Contraseña de ${user.name} actualizada.`);
  };

  const ejecutarEliminacionUsuario = () => {
    if (!modalConfirmacion) return;
    const { user } = modalConfirmacion;
    setUsuarios(usuarios.filter(u => u.id !== user.id));
    setModalConfirmacion(null);
    alert(`Usuario ${user.name} eliminado.`);
  };

  const handleCrearClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoClubNombre) return;

    const newClubId = `club_${Date.now()}`;
    const nuevoClub: Club = {
      id: newClubId,
      nombre: nuevoClubNombre,
      temporada: nuevoClubTemporada || '2026/27',
      logoUrl: null
    };

    const equiposBase: Team[] = [
      {
        id: `t_${Date.now()}_1`,
        clubId: newClubId,
        nombre: 'Alevín A',
        categoria: 'Alevín (2014-2015)',
        gender: 'MASCULINO',
        entrenador: 'Por asignar',
        jugadores: [],
        sesiones: []
      }
    ];

    setClubs([...clubs, nuevoClub]);
    setEquipos([...equipos, ...equiposBase]);
    setClubActivoId(newClubId);
    setEquipoSeleccionado(equiposBase[0]);
    setNuevoClubNombre('');
    setPantalla('EQUIPOS');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCatNombre) return;
    const nueva: RubricCategory = {
      id: `cat_${Date.now()}`,
      nombre: nuevaCatNombre,
      items: []
    };
    if (pestanaRubrica === 'JUGADORES') {
      setRubricasJugadores([...rubricasJugadores, nueva]);
    } else {
      setRubricasEntrenadores([...rubricasEntrenadores, nueva]);
    }
    setNuevaCatNombre('');
  };

  const handleAddItemToCategory = (catId: string) => {
    const texto = nuevoItemTexto[catId];
    if (!texto) return;
    if (pestanaRubrica === 'JUGADORES') {
      setRubricasJugadores(rubricasJugadores.map(cat => cat.id === catId ? { ...cat, items: [...cat.items, texto] } : cat));
    } else {
      setRubricasEntrenadores(rubricasEntrenadores.map(cat => cat.id === catId ? { ...cat, items: [...cat.items, texto] } : cat));
    }
    setNuevoItemTexto({ ...nuevoItemTexto, [catId]: '' });
  };

  const rubricasActivas = tipoEvaluacion === 'JUGADORES' ? rubricasJugadores : rubricasEntrenadores;
  const nivelesActuales = tipoEvaluacion === 'JUGADORES' ? NIVELES_JUGADORES : NIVELES_ENTRENADORES;

  const entrenadoresFiltrados: Coach[] = equiposFiltrados.map(eq => ({
    id: `c_${eq.id}`,
    nombre: eq.entrenador,
    cargo: 'Entrenador/a Principal',
    equipoNombre: eq.nombre,
    gender: eq.gender,
    inicial: 'COMPLETADA',
    media: 'PENDIENTE',
    final: 'PENDIENTE'
  }));

  const siglasClub = clubActivo.nombre
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0].toUpperCase())
    .slice(0, 3)
    .join('');

  const calcularAsistenciaJugador = (playerId?: string, team?: Team) => {
    if (!playerId || !team) return { pct: 100, presentes: 0, totalValidas: 0, totalSesiones: 0 };
    const sesiones = team.sesiones || [];
    if (sesiones.length === 0) return { pct: 100, presentes: 0, totalValidas: 0, totalSesiones: 0 };

    let presentes = 0;
    let justificadas = 0;
    let evaluadas = 0;

    sesiones.forEach(s => {
      const st = s.asistencias[playerId];
      if (st) {
        evaluadas++;
        if (st === 'PRESENTE') presentes++;
        if (st === 'JUSTIFICADA') justificadas++;
      }
    });

    const totalValidas = evaluadas - justificadas;
    const pct = totalValidas > 0 ? Math.round((presentes / totalValidas) * 100) : 100;
    return { pct, presentes, totalValidas, totalSesiones: sesiones.length };
  };

  const handleExportarExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Dorsal;Nombre;Nacimiento;Porcentaje Asistencia;Sesiones Totales;Ev Inicial;Ev Media;Ev Final\n';

    equipoSeleccionado.jugadores.forEach(j => {
      const asist = calcularAsistenciaJugador(j.id, equipoSeleccionado);
      csvContent += `${j.dorsal};"${j.nombre}";${j.nacimiento};${asist.pct}%;${asist.totalSesiones};${j.inicial};${j.media};${j.final}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Plantilla_${equipoSeleccionado.nombre.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calcularPromedioCategoria = (categoriaIdx: number) => {
    const cat = rubricasActivas[categoriaIdx];
    if (!cat || cat.items.length === 0) return 0.7;
    let suma = 0;
    let total = 0;
    cat.items.forEach(item => {
      const lvlKey = respuestas[item]?.nivel;
      const lvl = nivelesActuales.find(n => n.key === lvlKey);
      if (lvl && lvl.weight > 0) {
        suma += lvl.weight;
        total++;
      }
    });
    return total > 0 ? (suma / (total * 4)) : 0.7;
  };

  const c1Val = calcularPromedioCategoria(0);
  const c2Val = calcularPromedioCategoria(1);
  const c3Val = calcularPromedioCategoria(2);
  const c4Val = calcularPromedioCategoria(3);

  const cx = 75, cy = 75, r = 50;
  const p1 = `${cx},${cy - r * c1Val}`;
  const p2 = `${cx + r * c2Val},${cy}`;
  const p3 = `${cx},${cy + r * c3Val}`;
  const p4 = `${cx - r * c4Val},${cy}`;
  const radarPoints = `${p1} ${p2} ${p3} ${p4}`;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setClubs(clubs.map(c => c.id === clubActivo.id ? { ...c, logoUrl: url } : c));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAbrirPaseLista = () => {
    const initStatus: Record<string, AttendanceStatus> = {};
    if (equipoSeleccionado && equipoSeleccionado.jugadores) {
      equipoSeleccionado.jugadores.forEach(j => {
        initStatus[j.id] = 'PRESENTE';
      });
    }
    setSessionAsistencias(initStatus);
    setPantalla('PASAR_LISTA');
  };

  const handleGuardarSesion = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaSesion: Session = {
      id: Date.now().toString(),
      fecha: sessionFecha,
      tipo: sessionTipo,
      asistencias: sessionAsistencias
    };

    const actualizados = equipos.map(eq => {
      if (eq.id === equipoSeleccionado.id) {
        const ses = [...(eq.sesiones || []), nuevaSesion];
        const eqActualizado = { ...eq, sesiones: ses };
        setEquipoSeleccionado(eqActualizado);
        return eqActualizado;
      }
      return eq;
    });

    setEquipos(actualizados);
    setPantalla('PLANTILLA');
  };

  const handleCrearEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreEquipo) return;
    const nuevo: Team = {
      id: `t_${Date.now()}`,
      clubId: clubActivo.id,
      nombre: nuevoNombreEquipo,
      categoria: nuevaCatEquipo || 'General',
      gender: genero,
      entrenador: nuevoEntrenador || 'Por asignar',
      jugadores: [],
      sesiones: []
    };

    setEquipos([...equipos, nuevo]);
    setEquipoSeleccionado(nuevo);
    setNuevoNombreEquipo('');
    setNuevaCatEquipo('');
    setNuevoEntrenador('');
    setPantalla('EQUIPOS');
  };

  const handleAddJugador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreJugador) return;
    const randomHex = Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
    const secureToken = `sec_${randomHex}`;
    
    const nuevoJ: Player = {
      id: `j_${Date.now()}`,
      nombre: nuevoNombreJugador,
      dorsal: parseInt(nuevoDorsal) || 0,
      nacimiento: parseInt(nuevoNacimiento) || 2015,
      tokenPublico: secureToken,
      inicial: 'PENDIENTE',
      media: 'PENDIENTE',
      final: 'PENDIENTE'
    };

    const actualizados = equipos.map(eq => {
      if (eq.id === equipoSeleccionado.id) {
        const nuevosJugs = [...eq.jugadores, nuevoJ];
        const eqActualizado = { ...eq, jugadores: nuevosJugs };
        setEquipoSeleccionado(eqActualizado);
        return eqActualizado;
      }
      return eq;
    });

    setEquipos(actualizados);
    setNuevoNombreJugador('');
    setNuevoDorsal('');
    setNuevoNacimiento('');
  };

  const handleScore = (indicador: string, levelKey: string) => {
    setRespuestas(prev => ({
      ...prev,
      [indicador]: { ...prev[indicador], nivel: levelKey }
    }));
  };

  const handleObs = (indicador: string, obs: string) => {
    setRespuestas(prev => ({
      ...prev,
      [indicador]: { ...prev[indicador], obs }
    }));
  };

  const toggleObs = (itemKey: string) => {
    setObsAbiertas(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const badgeStatus = (status: 'COMPLETADA' | 'BORRADOR' | 'PENDIENTE') => {
    switch (status) {
      case 'COMPLETADA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Completada</span>;
      case 'BORRADOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Borrador</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Pendiente</span>;
    }
  };

  const asistActual = calcularAsistenciaJugador(jugadorSeleccionado?.id, equipoSeleccionado);
  const publicFamilyUrl = `https://evaculacion-clu-bs.vercel.app/?token=${jugadorSeleccionado?.tokenPublico || 'sec_8f9a2b1c4e7d'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicFamilyUrl)}`;

  // ==========================================
  // VISTA PÚBLICA PARA FAMILIAS (QR)
  // ==========================================
  if (publicToken) {
    let jugadorPublico: Player | undefined;
    let equipoPublico: Team | undefined;
    let clubPublico: Club | undefined;

    for (const eq of equipos) {
      const j = eq.jugadores.find(p => p.tokenPublico === publicToken || p.id === publicToken);
      if (j) {
        jugadorPublico = j;
        equipoPublico = eq;
        clubPublico = clubs.find(c => c.id === eq.clubId);
        break;
      }
    }

    if (!jugadorPublico) {
      jugadorPublico = equipos[0]?.jugadores[0] || EQUIPOS_INICIALES[0].jugadores[0];
      equipoPublico = equipos[0] || EQUIPOS_INICIALES[0];
      clubPublico = clubs[0] || CLUBS_INICIALES[0];
    }

    const asistPublico = calcularAsistenciaJugador(jugadorPublico.id, equipoPublico);
    const siglasPublico = (clubPublico?.nombre || 'CB')
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0].toUpperCase())
      .slice(0, 3)
      .join('');

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-6 font-sans">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 font-bold text-slate-800 text-base overflow-hidden">
                {clubPublico?.logoUrl ? (
                  <img src={clubPublico.logoUrl} alt="Escudo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-emerald-600 font-bold">{siglasPublico}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                  Portal de Seguimiento Deportivo
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{jugadorPublico.nombre}</h1>
                <p className="text-xs text-slate-500">
                  {clubPublico?.nombre} • {equipoPublico?.nombre} • Dorsal #{jugadorPublico.dorsal} ({jugadorPublico.nacimiento})
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                Asistencia: {asistPublico.pct}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">{asistPublico.presentes} de {asistPublico.totalSesiones} sesiones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {rubricasJugadores.map(cat => (
              <div key={cat.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  {cat.nombre}
                </h3>
                <div className="space-y-1.5 pt-1">
                  {cat.items.map(item => {
                    const sel = respuestas[item]?.nivel || 'CONSOLIDADO';
                    const lvl = NIVELES_JUGADORES.find(l => l.key === sel);
                    return (
                      <div key={item} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200/80">
                        <span className="font-medium text-slate-800">{item}</span>
                        <span 
                          className="font-bold text-[10px] px-2 py-0.5 rounded"
                          style={{ 
                            color: lvl?.color || '#16A34A',
                            backgroundColor: lvl?.key === 'EXCELENTE' ? '#F0FDF4' : lvl?.key === 'CONSOLIDADO' ? '#F0FDF4' : lvl?.key === 'EN_DESARROLLO' ? '#FFFBEB' : '#FEF2F2'
                          }}
                        >
                          {lvl ? lvl.label : 'Consolidado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
              <h4 className="font-bold text-emerald-950 uppercase text-[11px] mb-1">Fortalezas</h4>
              <p className="text-emerald-900 leading-relaxed">{fortalezas}</p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
              <h4 className="font-bold text-amber-950 uppercase text-[11px] mb-1">Objetivos de Mejora</h4>
              <p className="text-amber-900 leading-relaxed">{objetivos}</p>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between items-center text-xs text-slate-400">
            <span>Evaluación {periodo} • {clubPublico?.temporada}</span>
            <button
              onClick={() => {
                window.history.pushState({}, '', window.location.pathname);
                setPublicToken(null);
              }}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Acceso Privado Entrenadores →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA: PORTADA PROFESIONAL (LOGIN LIMPIO)
  // ==========================================
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
        {/* Luces de fondo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
          
          {/* Columna Izquierda: Presentación y Metodología */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dirección Técnica &amp; Metodología Deportiva</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                El estándar digital en evaluación técnica y seguimiento deportivo.
              </h1>
              
              {/* Subtítulo Renovado */}
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                La plataforma integral para la dirección técnica y el desarrollo del deportista. Centraliza el control de sesiones, unifica criterios formativos y ofrece a las familias una visión transparente de su evolución.
              </p>

              {/* Módulos Destacados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-emerald-400 font-bold mb-1 flex items-center space-x-1.5">
                    <span>📊</span>
                    <span>Rúbricas FEB / ACB</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Evaluación en 4 ejes con gráfico de radar de rendimiento motriz, técnico y táctico.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-blue-400 font-bold mb-1 flex items-center space-x-1.5">
                    <span>📋</span>
                    <span>Asistencia en Pista</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Pase de lista en 10 segundos con cálculo de porcentaje real y exportación a Excel.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-purple-400 font-bold mb-1 flex items-center space-x-1.5">
                    <span>📱</span>
                    <span>Acceso QR para Familias</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Consulta en tiempo real para padres con token encriptado y seguro según RGPD.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-amber-400 font-bold mb-1 flex items-center space-x-1.5">
                    <span>🖨️</span>
                    <span>Dossier Oficial A4</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Informes calibrados al milímetro para impresión en una sola hoja con el escudo del club.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tecnología Multi-Club &bull; 2026</span>
              <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Servidores Seguros Activos
              </span>
            </div>
          </div>

          {/* Columna Derecha: Login Corporativo Limpio */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center bg-slate-900/40">
            <div className="max-w-sm mx-auto w-full space-y-6">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Acceso a la Plataforma</h2>
                <p className="text-xs text-slate-400 mt-1">Introduce tus credenciales autorizadas</p>
              </div>

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Correo Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="direccion@club.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition text-xs"
                >
                  Entrar al Portal
                </button>
              </form>

              {/* Botón Discreto para Demostraciones en Vivo */}
              <div className="pt-4 border-t border-slate-800 text-center">
                {!mostrarDemo ? (
                  <button
                    type="button"
                    onClick={() => setMostrarDemo(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-400 transition"
                  >
                    🛠️ Modo Demostración en Vivo
                  </button>
                ) : (
                  <div className="space-y-2 text-left animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Accesos Rápidos Demo</span>
                      <button
                        type="button"
                        onClick={() => setMostrarDemo(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        ✕ Ocultar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDemoLogin('SUPER_ADMIN')}
                      className="w-full bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-200 text-xs py-2 px-3 rounded-xl font-medium flex items-center justify-between transition"
                    >
                      <span>👑 Super Administrador</span>
                      <span className="text-[10px] text-purple-400">Global &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoLogin('DIRECTOR')}
                      className="w-full bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-200 text-xs py-2 px-3 rounded-xl font-medium flex items-center justify-between transition"
                    >
                      <span>🏢 Director Deportivo</span>
                      <span className="text-[10px] text-emerald-400">Club &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoLogin('ENTRENADOR')}
                      className="w-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-blue-200 text-xs py-2 px-3 rounded-xl font-medium flex items-center justify-between transition"
                    >
                      <span>📋 Entrenador en Pista</span>
                      <span className="text-[10px] text-blue-400">Carlos &rarr;</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA: APLICACIÓN PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans print:bg-white print:pb-0 print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-full-page {
            height: 282mm !important;
            max-height: 282mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {modalConfirmacion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            {modalConfirmacion.tipo === 'ELIMINAR_USUARIO' ? (
              <>
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
                  🗑️
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">¿Eliminar este usuario?</h3>
                  <p className="text-xs text-slate-500">
                    Estás a punto de revocar el acceso a <strong>{modalConfirmacion.user.name}</strong> ({modalConfirmacion.user.email}).
                  </p>
                </div>
                <div className="flex space-x-2 pt-3">
                  <button
                    onClick={() => setModalConfirmacion(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={ejecutarEliminacionUsuario}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto">
                  🔑
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Cambiar Contraseña</h3>
                  <p className="text-xs text-slate-500">
                    Nueva contraseña para <strong>{modalConfirmacion.user.name}</strong>:
                  </p>
                  <input
                    type="text"
                    value={modalConfirmacion.tempPass || ''}
                    onChange={(e) => setModalConfirmacion({ ...modalConfirmacion, tempPass: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-center text-sm focus:outline-none focus:border-emerald-500 bg-slate-50"
                    placeholder="Nueva clave..."
                  />
                </div>
                <div className="flex space-x-2 pt-3">
                  <button
                    onClick={() => setModalConfirmacion(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={ejecutarCambioPassword}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow"
                  >
                    Guardar Nueva Clave
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cabecera Principal */}
      <header className="bg-slate-900 text-white px-6 py-3 shadow-md print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => setPantalla(sessionUser.role === 'SUPER_ADMIN' ? 'PANEL_SUPERADMIN' : 'EQUIPOS')}
              className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs cursor-pointer overflow-hidden shadow-inner"
            >
              {clubActivo.logoUrl ? (
                <img src={clubActivo.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="font-bold text-emerald-400">{siglasClub || 'CB'}</span>
              )}
            </div>

            <div>
              {editandoClub && sessionUser.role === 'SUPER_ADMIN' ? (
                <div className="flex items-center flex-wrap gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                  <input
                    type="text"
                    value={clubActivo.nombre}
                    onChange={(e) => setClubs(clubs.map(c => c.id === clubActivo.id ? { ...c, nombre: e.target.value } : c))}
                    className="bg-slate-900 text-emerald-400 font-bold text-xs px-2 py-1 rounded border border-slate-600 focus:outline-none"
                    placeholder="Nombre del club / patrocinador"
                  />
                  <input
                    type="text"
                    value={clubActivo.temporada}
                    onChange={(e) => setClubs(clubs.map(c => c.id === clubActivo.id ? { ...c, temporada: e.target.value } : c))}
                    className="bg-slate-900 text-white text-xs px-2 py-1 w-20 rounded border border-slate-600 focus:outline-none"
                    placeholder="2026/27"
                  />
                  <label className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] px-2 py-1 rounded cursor-pointer font-medium border border-slate-600">
                    Cambiar Escudo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <button
                    onClick={() => setEditandoClub(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-3 py-1 rounded font-bold shadow"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {sessionUser.role === 'SUPER_ADMIN' ? (
                    <>
                      <select
                        value={clubActivoId}
                        onChange={(e) => setClubActivoId(e.target.value)}
                        className="bg-slate-800 text-emerald-400 font-bold text-sm px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
                      >
                        {clubs.map(c => (
                          <option key={c.id} value={c.id} className="text-white bg-slate-800">
                            {c.nombre} ({c.temporada})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditandoClub(true)}
                        className="text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-semibold px-2 py-1 rounded shadow"
                      >
                        ✏️ Renombrar
                      </button>
                      <button
                        onClick={() => setPantalla('PANEL_SUPERADMIN')}
                        className="text-[10px] bg-purple-700 hover:bg-purple-600 text-white font-semibold px-2 py-1 rounded shadow"
                      >
                        Panel Master
                      </button>
                      <button
                        onClick={() => setPantalla('EDITOR_RUBRICAS')}
                        className="text-[10px] bg-blue-700 hover:bg-blue-600 text-white font-semibold px-2 py-1 rounded shadow"
                      >
                        ⚙️ Rúbricas
                      </button>
                    </>
                  ) : (
                    <div>
                      <h1 className="text-sm font-bold text-emerald-400">{clubActivo.nombre}</h1>
                      <p className="text-[11px] text-slate-400">{sessionUser.name} • {sessionUser.role === 'DIRECTOR' ? 'Director/a Técnico' : 'Entrenador/a'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {sessionUser.role !== 'ENTRENADOR' && (
              <>
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => {
                      setGenero('FEMENINO');
                      setPantalla(tipoEvaluacion === 'JUGADORES' ? 'EQUIPOS' : 'LISTA_ENTRENADORES');
                    }}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      genero === 'FEMENINO' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Femenino
                  </button>
                  <button
                    onClick={() => {
                      setGenero('MASCULINO');
                      setPantalla(tipoEvaluacion === 'JUGADORES' ? 'EQUIPOS' : 'LISTA_ENTRENADORES');
                    }}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      genero === 'MASCULINO' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Masculino
                  </button>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => { setTipoEvaluacion('JUGADORES'); setPantalla('EQUIPOS'); }}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      tipoEvaluacion === 'JUGADORES' ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Jugador@s
                  </button>
                  <button
                    onClick={() => { setTipoEvaluacion('ENTRENADORES'); setPantalla('LISTA_ENTRENADORES'); }}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      tipoEvaluacion === 'ENTRENADORES' ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Entrenador@s
                  </button>
                </div>
              </>
            )}

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Period)}
              className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="Inicial">Ev. Inicial</option>
              <option value="Media">Ev. Media</option>
              <option value="Final">Ev. Final</option>
            </select>

            <button
              onClick={handleLogout}
              className="bg-rose-900/40 hover:bg-rose-800 text-rose-300 text-xs px-2.5 py-1.5 rounded-lg border border-rose-700/50 transition font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-4xl mx-auto mt-6 px-4 print:mt-0 print:px-0 print:max-w-full print:w-full">
        
        {/* MODAL QR FAMILIAS */}
        {pantalla === 'MODAL_QR' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm mx-auto text-center space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Acceso Público Familias (RGPD Seguro)
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{jugadorSeleccionado.nombre}</h2>
              <p className="text-xs text-slate-500">Dorsal #{jugadorSeleccionado.dorsal} • {equipoSeleccionado.nombre}</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner inline-block mx-auto">
              <img src={qrCodeUrl} alt="QR Ficha Deportista" className="w-48 h-48 mx-auto" />
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Código encriptado único para padres y tutores. Consulta en directo desde cualquier teléfono móvil.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicFamilyUrl);
                  alert('¡Enlace seguro copiado al portapapeles!');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-lg shadow"
              >
                📋 Copiar Enlace para WhatsApp
              </button>
              <button
                onClick={() => setPantalla('PLANTILLA')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* EDITOR DE RÚBRICAS */}
        {pantalla === 'EDITOR_RUBRICAS' && sessionUser.role === 'SUPER_ADMIN' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <button
                  onClick={() => setPantalla('EQUIPOS')}
                  className="text-xs text-blue-600 font-semibold mb-1 hover:underline"
                >
                  ← Volver a equipos
                </button>
                <h2 className="text-xl font-bold text-slate-900">Editor Maestro de Rúbricas Técnicas</h2>
                <p className="text-xs text-slate-500">Personaliza de forma separada los criterios para Jugadores y Entrenadores.</p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setPestanaRubrica('JUGADORES')}
                  className={`px-3 py-1.5 rounded-md transition ${pestanaRubrica === 'JUGADORES' ? 'bg-blue-600 text-white shadow' : 'text-slate-600'}`}
                >
                  Rúbrica Jugador@s
                </button>
                <button
                  onClick={() => setPestanaRubrica('ENTRENADORES')}
                  className={`px-3 py-1.5 rounded-md transition ${pestanaRubrica === 'ENTRENADORES' ? 'bg-blue-600 text-white shadow' : 'text-slate-600'}`}
                >
                  Rúbrica Entrenador@s
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre de la nueva categoría..."
                value={nuevaCatNombre}
                onChange={(e) => setNuevaCatNombre(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg p-2.5"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 rounded-lg shadow"
              >
                + Añadir Categoría
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(pestanaRubrica === 'JUGADORES' ? rubricasJugadores : rubricasEntrenadores).map((cat) => (
                <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm uppercase">{cat.nombre}</h3>
                  </div>

                  <div className="space-y-1.5">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                        <span className="font-medium text-slate-800">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-2">
                    <input
                      type="text"
                      placeholder="Nuevo criterio..."
                      value={nuevoItemTexto[cat.id] || ''}
                      onChange={(e) => setNuevoItemTexto({ ...nuevoItemTexto, [cat.id]: e.target.value })}
                      className="flex-1 text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItemToCategory(cat.id)}
                      className="bg-slate-800 text-white text-xs px-3 rounded font-medium hover:bg-slate-700"
                    >
                      + Ítem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL SUPER ADMIN */}
        {pantalla === 'PANEL_SUPERADMIN' && sessionUser.role === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            <div className="bg-purple-900 text-white p-6 rounded-2xl shadow flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-purple-300">Panel Maestro de la Plataforma</span>
                <h2 className="text-2xl font-bold">Gestión de Clubes, Accesos y Contraseñas</h2>
                <p className="text-xs text-purple-200 mt-1">Modifica credenciales, da de alta o elimina usuarios con confirmación de seguridad.</p>
              </div>
              <button
                onClick={() => setPantalla('EQUIPOS')}
                className="bg-white text-purple-900 font-bold text-xs px-4 py-2 rounded-lg hover:bg-purple-50 shadow"
              >
                Ver App como Club →
              </button>
            </div>

            {/* 1. Alta de Club */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm mb-4">1. Dar de Alta Nuevo Club / Colegio</h3>
              <form onSubmit={handleCrearClub} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Nombre del Club (ej: CB Juventud)"
                  value={nuevoClubNombre}
                  onChange={(e) => setNuevoClubNombre(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5"
                />
                <input
                  type="text"
                  placeholder="Temporada (ej: 2026/27)"
                  value={nuevoClubTemporada}
                  onChange={(e) => setNuevoClubTemporada(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5"
                />
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg p-2.5 shadow"
                >
                  + Crear Club
                </button>
              </form>
            </div>

            {/* Clubes Activos */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Clubes Activos (Modificar Nombre o Escudo)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubs.map(c => (
                  <div key={c.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.nombre}</h4>
                      <p className="text-slate-500">Temporada: {c.temporada}</p>
                    </div>
                    <button
                      onClick={() => {
                        setClubActivoId(c.id);
                        setEditandoClub(true);
                        setPantalla('EQUIPOS');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow"
                    >
                      ✏️ Editar Datos
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Crear Usuario */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm mb-4">2. Crear Usuario y Asignar Contraseña</h3>
              <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Nombre completo"
                  value={nuevoUserNombre}
                  onChange={(e) => setNuevoUserNombre(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5"
                />
                <input
                  type="email"
                  required
                  placeholder="correo@club.com"
                  value={nuevoUserEmail}
                  onChange={(e) => setNuevoUserEmail(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5"
                />
                <input
                  type="text"
                  required
                  placeholder="Contraseña inicial"
                  value={nuevoUserPass}
                  onChange={(e) => setNuevoUserPass(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5 font-mono"
                />
                <select
                  value={nuevoUserRol}
                  onChange={(e) => setNuevoUserRol(e.target.value as UserRole)}
                  className="border border-slate-300 rounded-lg p-2.5"
                >
                  <option value="DIRECTOR">Director Técnico (Club)</option>
                  <option value="ENTRENADOR">Entrenador (Equipo)</option>
                </select>
                <select
                  value={nuevoUserClubId}
                  onChange={(e) => setNuevoUserClubId(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2.5"
                >
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <div className="md:col-span-5 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow"
                  >
                    Crear y Asignar Credenciales
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Listado de Usuarios */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm mb-4">3. Gestión de Contraseñas y Usuarios Activos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2">Correo</th>
                      <th className="pb-2">Rol</th>
                      <th className="pb-2">Club</th>
                      <th className="pb-2 text-right">Acciones de Cuenta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map(u => {
                      const userClub = clubs.find(c => c.id === u.clubId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-900">{u.name}</td>
                          <td className="py-2.5 text-slate-600">{u.email}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'DIRECTOR' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-700">{userClub ? userClub.nombre : 'Global'}</td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button
                              onClick={() => setModalConfirmacion({ tipo: 'EDITAR_PASSWORD', user: u, tempPass: u.pass })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded text-xs border border-slate-300"
                              title="Cambiar contraseña"
                            >
                              🔑 Cambiar Clave
                            </button>
                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => setModalConfirmacion({ tipo: 'ELIMINAR_USUARIO', user: u })}
                                className="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 border border-rose-200 text-xs"
                                title="Eliminar usuario"
                              >
                                🗑️ Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LISTADO DE EQUIPOS */}
        {pantalla === 'EQUIPOS' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {sessionUser.role !== 'ENTRENADOR' ? `${clubActivo.nombre} — Sección ${genero === 'FEMENINO' ? 'Femenina' : 'Masculina'}` : 'Mis Equipos Asignados'}
                </h2>
                <p className="text-xs text-slate-500">Temporada {clubActivo.temporada} • Gestión de categorías y plantillas</p>
              </div>
              {sessionUser.role !== 'ENTRENADOR' && (
                <button
                  onClick={() => setPantalla('MODAL_NUEVO_EQUIPO')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-lg font-semibold shadow-sm transition"
                >
                  + Nuevo Equipo
                </button>
              )}
            </div>

            {equiposFiltrados.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                No hay equipos registrados en esta categoría.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equiposFiltrados.map((equipo) => (
                  <div
                    key={equipo.id}
                    onClick={() => {
                      setEquipoSeleccionado(equipo);
                      setPantalla('PLANTILLA');
                    }}
                    className="p-5 border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition cursor-pointer bg-slate-50/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{equipo.nombre}</h3>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {equipo.jugadores.length} jugadores
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{equipo.categoria}</p>
                    <div className="text-xs text-slate-600 flex items-center justify-between border-t border-slate-200/80 pt-3">
                      <span>Entrenador/a: <strong>{equipo.entrenador}</strong></span>
                      <span className="text-emerald-600 font-semibold">Ver plantilla →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLANTILLA */}
        {pantalla === 'PLANTILLA' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <button
                  onClick={() => setPantalla('EQUIPOS')}
                  className="text-xs text-emerald-700 font-semibold mb-1 hover:underline"
                >
                  ← Volver a equipos de {clubActivo.nombre}
                </button>
                <h2 className="text-xl font-bold text-slate-900">{equipoSeleccionado.nombre}</h2>
                <p className="text-xs text-slate-500">
                  {equipoSeleccionado.categoria} • Entrenador/a: {equipoSeleccionado.entrenador} • <strong>{equipoSeleccionado.sesiones?.length || 0} sesiones</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportarExcel}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition"
                  title="Descargar datos en formato Excel"
                >
                  📊 Excel / CSV
                </button>
                <button
                  onClick={handleAbrirPaseLista}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition"
                >
                  📋 Pasar Lista
                </button>
                <button
                  onClick={() => setPantalla('INFORME_EQUIPO')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold shadow-sm transition"
                >
                  🖨️ Imprimir Todo
                </button>
              </div>
            </div>

            <form onSubmit={handleAddJugador} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre y Apellidos</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre de la jugadora/o"
                  value={nuevoNombreJugador}
                  onChange={(e) => setNuevoNombreJugador(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div className="w-16">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dorsal</label>
                <input
                  type="number"
                  placeholder="7"
                  value={nuevoDorsal}
                  onChange={(e) => setNuevoDorsal(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div className="w-20">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Año Nac.</label>
                <input
                  type="number"
                  placeholder="2015"
                  value={nuevoNacimiento}
                  onChange={(e) => setNuevoNacimiento(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded shadow-sm"
              >
                + Añadir
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="pb-3 px-2">Dorsal</th>
                    <th className="pb-3 px-2">Nombre</th>
                    <th className="pb-3 px-2">Año</th>
                    <th className="pb-3 px-2 text-center">Asistencia Real</th>
                    <th className="pb-3 px-2 text-center">Ev. Inicial</th>
                    <th className="pb-3 px-2 text-center">Ev. Media</th>
                    <th className="pb-3 px-2 text-center">Ev. Final</th>
                    <th className="pb-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipoSeleccionado.jugadores.map((jugador) => {
                    const asist = calcularAsistenciaJugador(jugador.id, equipoSeleccionado);
                    return (
                      <tr key={jugador.id} className="hover:bg-slate-50">
                        <td className="py-3 px-2 font-bold text-slate-700">#{jugador.dorsal}</td>
                        <td className="py-3 px-2 font-medium text-slate-900">{jugador.nombre}</td>
                        <td className="py-3 px-2 text-slate-500">{jugador.nacimiento}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            asist.pct >= 85 ? 'bg-emerald-100 text-emerald-800' : asist.pct >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {asist.pct}% ({asist.presentes}/{asist.totalSesiones})
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">{badgeStatus(jugador.inicial)}</td>
                        <td className="py-3 px-2 text-center">{badgeStatus(jugador.media)}</td>
                        <td className="py-3 px-2 text-center">{badgeStatus(jugador.final)}</td>
                        <td className="py-3 px-2 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setJugadorSeleccionado(jugador);
                              setPantalla('FORMULARIO');
                            }}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded hover:bg-emerald-700 font-medium"
                          >
                            Evaluar
                          </button>
                          <button
                            onClick={() => {
                              setJugadorSeleccionado(jugador);
                              setPantalla('INFORME');
                            }}
                            className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 font-medium border border-slate-200"
                          >
                            Ficha
                          </button>
                          <button
                            onClick={() => {
                              setJugadorSeleccionado(jugador);
                              setPantalla('MODAL_QR');
                            }}
                            className="bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 font-medium border border-purple-200"
                            title="Código QR para padres"
                          >
                            📱 QR
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PASAR LISTA */}
        {pantalla === 'PASAR_LISTA' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Registro Diario de Asistencia</h2>
                <p className="text-xs text-slate-500">{clubActivo.nombre} • {equipoSeleccionado.nombre}</p>
              </div>
              <button
                onClick={() => setPantalla('PLANTILLA')}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕ Cancelar
              </button>
            </div>

            <form onSubmit={handleGuardarSesion} className="space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de la sesión</label>
                  <input
                    type="date"
                    required
                    value={sessionFecha}
                    onChange={(e) => setSessionFecha(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Convocatoria</label>
                  <select
                    value={sessionTipo}
                    onChange={(e) => setSessionTipo(e.target.value as SessionType)}
                    className="w-full border border-slate-300 rounded p-2 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ENTRENAMIENTO">Entrenamiento Regular</option>
                    <option value="PARTIDO">Partido Oficial / Amistoso</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Control de Jugador@s</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {equipoSeleccionado.jugadores.map((jugador) => {
                    const estado = sessionAsistencias[jugador.id] || 'PRESENTE';
                    return (
                      <div key={jugador.id} className="flex justify-between items-center p-3 bg-white hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">#{jugador.dorsal} {jugador.nombre}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({jugador.nacimiento})</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'PRESENTE' })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              estado === 'PRESENTE' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ✅ Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'FALTA' })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              estado === 'FALTA' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ❌ Falta
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'JUSTIFICADA' })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              estado === 'JUSTIFICADA' ? 'bg-amber-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            📝 Justificada
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'LESIONADO' })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              estado === 'LESIONADO' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            🩹 Lesión
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPantalla('PLANTILLA')}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 shadow"
                >
                  Guardar Sesión
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL CREAR EQUIPO */}
        {pantalla === 'MODAL_NUEVO_EQUIPO' && sessionUser.role !== 'ENTRENADOR' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Crear Equipo — {clubActivo.nombre}
            </h2>
            <p className="text-xs text-slate-500 mb-6">Temporada {clubActivo.temporada}</p>

            <form onSubmit={handleCrearEquipo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del equipo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cadete Preferente"
                  value={nuevoNombreEquipo}
                  onChange={(e) => setNuevoNombreEquipo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría / Edades</label>
                <input
                  type="text"
                  placeholder="Ej: Cadete (2011-2012)"
                  value={nuevaCatEquipo}
                  onChange={(e) => setNuevaCatEquipo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entrenador/a asignado</label>
                <input
                  type="text"
                  placeholder="Ej: Marcos López"
                  value={nuevoEntrenador}
                  onChange={(e) => setNuevoEntrenador(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPantalla('EQUIPOS')}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-emerald-700 shadow"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTA ENTRENADORES */}
        {pantalla === 'LISTA_ENTRENADORES' && sessionUser.role !== 'ENTRENADOR' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cuerpo Técnico — {clubActivo.nombre}
                </h2>
                <p className="text-xs text-slate-500">Evaluación metodológica, pedagógica y de gestión de grupo</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="pb-3 px-2">Entrenador/a</th>
                    <th className="pb-3 px-2">Equipo Asignado</th>
                    <th className="pb-3 px-2 text-center">Ev. Inicial</th>
                    <th className="pb-3 px-2 text-center">Ev. Media</th>
                    <th className="pb-3 px-2 text-center">Ev. Final</th>
                    <th className="pb-3 px-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entrenadoresFiltrados.map((coach) => (
                    <tr key={coach.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-2 font-bold text-slate-800">{coach.nombre}</td>
                      <td className="py-3.5 px-2 text-slate-600">{coach.equipoNombre}</td>
                      <td className="py-3.5 px-2 text-center">{badgeStatus(coach.inicial)}</td>
                      <td className="py-3.5 px-2 text-center">{badgeStatus(coach.media)}</td>
                      <td className="py-3.5 px-2 text-center">{badgeStatus(coach.final)}</td>
                      <td className="py-3.5 px-2 text-right space-x-2">
                        <button
                          onClick={() => {
                            setCoachSeleccionado(coach);
                            setPantalla('FORMULARIO');
                          }}
                          className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 font-medium"
                        >
                          Evaluar
                        </button>
                        <button
                          onClick={() => {
                            setCoachSeleccionado(coach);
                            setPantalla('INFORME');
                          }}
                          className="bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200 font-medium border border-slate-200"
                        >
                          Ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FORMULARIO */}
        {pantalla === 'FORMULARIO' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
              <div>
                <button
                  onClick={() => setPantalla(tipoEvaluacion === 'JUGADORES' ? 'PLANTILLA' : 'LISTA_ENTRENADORES')}
                  className="text-xs text-emerald-700 font-semibold mb-1 hover:underline"
                >
                  ← Volver
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                  {tipoEvaluacion === 'JUGADORES' ? jugadorSeleccionado.nombre : coachSeleccionado?.nombre}
                </h2>
                <p className="text-xs text-slate-500">
                  {tipoEvaluacion === 'JUGADORES' 
                    ? `${clubActivo.nombre} • ${equipoSeleccionado.nombre} • dorsal ${jugadorSeleccionado.dorsal}` 
                    : `${clubActivo.nombre} • ${coachSeleccionado?.equipoNombre} • Entrenador/a Principal`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                  Evaluación {periodo} ({tipoEvaluacion === 'JUGADORES' ? 'Técnica Jugador' : 'Metodología Coach'})
                </span>
                <button
                  onClick={() => setPantalla('INFORME')}
                  className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-slate-800"
                >
                  Ver Ficha Oficial
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b border-slate-100 text-xs text-slate-600 font-medium">
              {nivelesActuales.map((n) => (
                <div key={n.key} className="flex items-center space-x-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-sm"
                    style={{ backgroundColor: n.color }}
                  />
                  <span>{n.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              {rubricasActivas.map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b-2 border-slate-900 pb-1">
                    {cat.nombre}
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {cat.items.map((item) => {
                      const sel = respuestas[item]?.nivel;
                      const obs = respuestas[item]?.obs || '';
                      const activeLevel = nivelesActuales.find((l) => l.key === sel);
                      const isObsOpen = obsAbiertas[item] || obs.length > 0;

                      return (
                        <div key={item} className="py-3.5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-800 text-sm">{item}</span>
                              {!isObsOpen && (
                                <button
                                  type="button"
                                  onClick={() => toggleObs(item)}
                                  className="text-[11px] text-slate-400 hover:text-emerald-700 underline"
                                >
                                  + nota
                                </button>
                              )}
                            </div>

                            <div className="flex items-center space-x-2.5">
                              {nivelesActuales.map((lvl) => (
                                <button
                                  key={lvl.key}
                                  type="button"
                                  onClick={() => handleScore(item, lvl.key)}
                                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                                    sel === lvl.key ? 'scale-110 shadow-sm' : 'border-slate-300 bg-white hover:border-slate-400'
                                  }`}
                                  style={{
                                    backgroundColor: sel === lvl.key ? lvl.color : '#ffffff',
                                    borderColor: sel === lvl.key ? lvl.color : '#cbd5e1'
                                  }}
                                  title={lvl.label}
                                />
                              ))}
                            </div>
                          </div>

                          {activeLevel && activeLevel.key !== 'NO_OBSERVADO' && (
                            <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 my-2 text-xs text-slate-700">
                              <strong className="font-semibold">{activeLevel.label}: </strong>
                              {activeLevel.desc}
                            </div>
                          )}

                          {isObsOpen && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Observación técnica o metodológica..."
                                value={obs}
                                onChange={(e) => handleObs(item, e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                              />
                              <button
                                type="button"
                                onClick={() => toggleObs(item)}
                                className="text-slate-400 hover:text-slate-600 text-xs px-1"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    {tipoEvaluacion === 'JUGADORES' ? 'Fortalezas Destacadas' : 'Aspectos Metodológicos Sobresalientes'}
                  </label>
                  <textarea
                    value={fortalezas}
                    onChange={(e) => setFortalezas(e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    {tipoEvaluacion === 'JUGADORES' ? 'Objetivos de Mejora Técnica' : 'Plan de Acción de Dirección Técnica'}
                  </label>
                  <textarea
                    value={objetivos}
                    onChange={(e) => setObjetivos(e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Evaluador/a Responsable</label>
                  <input
                    type="text"
                    value={evaluadorNombre}
                    onChange={(e) => setEvaluadorNombre(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center border-t border-slate-200 pt-4">
              <button
                onClick={() => setPantalla(tipoEvaluacion === 'JUGADORES' ? 'PLANTILLA' : 'LISTA_ENTRENADORES')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded"
              >
                Guardar borrador
              </button>
              <button
                onClick={() => setPantalla('INFORME')}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded shadow"
              >
                Cerrar ficha y ver informe
              </button>
            </div>
          </div>
        )}

        {/* INFORME OFICIAL (1 HOJA A4) */}
        {pantalla === 'INFORME' && (
          <div className="print-full-page bg-white rounded-xl shadow border border-slate-200 p-8 print:p-0 print:border-none print:shadow-none print:rounded-none">
            
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                  {clubActivo.logoUrl ? (
                    <img src={clubActivo.logoUrl} alt="Escudo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-bold text-slate-800 text-xl">{siglasClub || 'CB'}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {tipoEvaluacion === 'JUGADORES' ? jugadorSeleccionado.nombre : coachSeleccionado?.nombre}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    {clubActivo.nombre} • {tipoEvaluacion === 'JUGADORES' ? equipoSeleccionado.nombre : coachSeleccionado?.equipoNombre}
                    {tipoEvaluacion === 'JUGADORES' ? ` • Dorsal ${jugadorSeleccionado.dorsal} • Nacimiento: ${jugadorSeleccionado.nacimiento}` : ' • Evaluación Metodológica de Cuerpo Técnico'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Temporada {clubActivo.temporada}</p>
                <p className="text-xs text-slate-500">Evaluación {periodo} • {new Date().toLocaleDateString('es-ES')}</p>
                {tipoEvaluacion === 'JUGADORES' && (
                  <span className="inline-block mt-1 text-[11px] bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-semibold border border-slate-200">
                    Asistencia: {asistActual.pct}% ({asistActual.presentes}/{asistActual.totalSesiones} ses.)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 my-4 text-xs">
              <div className="space-y-4">
                {rubricasActivas.slice(0, 2).map((cat) => (
                  <div key={cat.id}>
                    <div className="bg-slate-900 text-white font-bold px-3 py-1 rounded text-[11px] uppercase tracking-wider mb-2">
                      {cat.nombre}
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const lvlKey = respuestas[item]?.nivel;
                        const level = nivelesActuales.find((l) => l.key === lvlKey);
                        return (
                          <div key={item} className="flex justify-between items-center py-0.5 px-1 bg-white">
                            <span className="text-slate-800 font-medium text-[11.5px]">{item}</span>
                            <span 
                              className="font-semibold px-2.5 py-0.5 rounded text-[10.5px]"
                              style={{ 
                                color: level?.color || '#64748B',
                                backgroundColor: level?.key === 'EXCELENTE' ? '#F0FDF4' : level?.key === 'CONSOLIDADO' || level?.key === 'BUENO' ? '#F0FDF4' : level?.key === 'EN_DESARROLLO' || level?.key === 'MEJORABLE' ? '#FFFBEB' : level?.key === 'NECESITA_APOYO' ? '#FEF2F2' : '#F8FAFC'
                              }}
                            >
                              {level ? level.label : 'Sin evaluar'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {rubricasActivas.slice(2, 4).map((cat) => (
                  <div key={cat.id}>
                    <div className="bg-slate-900 text-white font-bold px-3 py-1 rounded text-[11px] uppercase tracking-wider mb-2">
                      {cat.nombre}
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const lvlKey = respuestas[item]?.nivel;
                        const level = nivelesActuales.find((l) => l.key === lvlKey);
                        return (
                          <div key={item} className="flex justify-between items-center py-0.5 px-1 bg-white">
                            <span className="text-slate-800 font-medium text-[11.5px]">{item}</span>
                            <span 
                              className="font-semibold px-2.5 py-0.5 rounded text-[10.5px]"
                              style={{ 
                                color: level?.color || '#64748B',
                                backgroundColor: level?.key === 'EXCELENTE' ? '#F0FDF4' : level?.key === 'CONSOLIDADO' || level?.key === 'BUENO' ? '#F0FDF4' : level?.key === 'EN_DESARROLLO' || level?.key === 'MEJORABLE' ? '#FFFBEB' : level?.key === 'NECESITA_APOYO' ? '#FEF2F2' : '#F8FAFC'
                              }}
                            >
                              {level ? level.label : 'Sin evaluar'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 pt-3 border-t border-slate-200 items-center">
              <div className="col-span-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {tipoEvaluacion === 'JUGADORES' ? 'Perfil de Rendimiento' : 'Balance Metodológico'}
                </span>
                <svg width="150" height="150" viewBox="0 0 150 150" className="overflow-visible">
                  <polygon points="75,25 125,75 75,125 25,75" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
                  <polygon points="75,50 100,75 75,100 50,75" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="75" y1="25" x2="75" y2="125" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="25" y1="75" x2="125" y2="75" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />

                  <polygon points={radarPoints} fill="rgba(22, 163, 74, 0.25)" stroke="#16A34A" strokeWidth="2.5" />

                  {tipoEvaluacion === 'JUGADORES' ? (
                    <>
                      <text x="75" y="17" textAnchor="middle" className="text-[8px] font-bold fill-slate-700">MOTOR</text>
                      <text x="132" y="78" textAnchor="start" className="text-[8px] font-bold fill-slate-700">TÉCNICA</text>
                      <text x="75" y="137" textAnchor="middle" className="text-[8px] font-bold fill-slate-700">TÁCTICA</text>
                      <text x="18" y="78" textAnchor="end" className="text-[8px] font-bold fill-slate-700">DEFENSA</text>
                    </>
                  ) : (
                    <>
                      <text x="75" y="17" textAnchor="middle" className="text-[8px] font-bold fill-slate-700">COMUNICACIÓN</text>
                      <text x="132" y="78" textAnchor="start" className="text-[8px] font-bold fill-slate-700">MÉTODO</text>
                      <text x="75" y="137" textAnchor="middle" className="text-[8px] font-bold fill-slate-700">DIRECCIÓN</text>
                      <text x="18" y="78" textAnchor="end" className="text-[8px] font-bold fill-slate-700">COMPROMISO</text>
                    </>
                  )}
                </svg>
              </div>

              <div className="col-span-8 space-y-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-0.5 text-[10.5px] uppercase tracking-wider">
                    {tipoEvaluacion === 'JUGADORES' ? 'Fortalezas Destacadas' : 'Aspectos Sobresalientes'}
                  </h5>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{fortalezas || 'Sin observaciones registradas.'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-0.5 text-[10.5px] uppercase tracking-wider">
                    {tipoEvaluacion === 'JUGADORES' ? 'Objetivos de Mejora' : 'Plan de Acción y Pautas Técnicas'}
                  </h5>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{objetivos || 'Sin objetivos registrados.'}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-500 font-medium">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-700 uppercase">Criterios:</span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /><span>Excelente</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span>{tipoEvaluacion === 'JUGADORES' ? 'Consolidado' : 'Bueno'}</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500" /><span>{tipoEvaluacion === 'JUGADORES' ? 'En desarrollo' : 'Mejorable'}</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Necesita apoyo</span></span>
              </div>
              <div>
                <span>Evaluador: <strong>{evaluadorNombre}</strong> • {clubActivo.nombre}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setPantalla('FORMULARIO')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                ← Volver a editar ficha
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white text-xs px-5 py-2.5 rounded font-medium hover:bg-slate-800 shadow"
              >
                Imprimir o guardar en PDF
              </button>
            </div>

          </div>
        )}

        {/* DOSSIER COMPLETO DE EQUIPO */}
        {pantalla === 'INFORME_EQUIPO' && (
          <div className="space-y-8 print:space-y-0">
            <div className="bg-white p-4 rounded-xl shadow border border-slate-200 flex justify-between items-center print:hidden">
              <div>
                <h3 className="font-bold text-slate-900">Dossier Completo de {equipoSeleccionado.nombre}</h3>
                <p className="text-xs text-slate-500">{clubActivo.nombre} • {equipoSeleccionado.jugadores.length} fichas individuales.</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setPantalla('PLANTILLA')}
                  className="text-xs text-slate-600 px-3 py-2 rounded font-semibold hover:bg-slate-100"
                >
                  ← Volver
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white text-xs px-5 py-2 rounded font-semibold shadow hover:bg-slate-800"
                >
                  Imprimir Todo el Equipo (PDF)
                </button>
              </div>
            </div>

            {equipoSeleccionado.jugadores.map((jugador) => {
              const asist = calcularAsistenciaJugador(jugador.id, equipoSeleccionado);
              return (
                <div key={jugador.id} className="print-full-page bg-white rounded-xl shadow border border-slate-200 p-8 page-break print:p-0 print:border-none print:shadow-none print:rounded-none">
                  
                  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                        {clubActivo.logoUrl ? (
                          <img src={clubActivo.logoUrl} alt="Escudo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-bold text-slate-800 text-xl">{siglasClub || 'CB'}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{jugador.nombre}</h2>
                        <p className="text-xs text-slate-600 font-medium">
                          {clubActivo.nombre} • {equipoSeleccionado.nombre} • Dorsal {jugador.dorsal} • {jugador.nacimiento}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Temporada {clubActivo.temporada}</p>
                      <p className="text-xs text-slate-500">Evaluación {periodo} • Asistencia: {asist.pct}% ({asist.presentes}/{asist.totalSesiones} ses.)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                    <div className="space-y-4">
                      {rubricasJugadores.slice(0, 2).map((cat) => (
                        <div key={cat.id}>
                          <div className="bg-slate-900 text-white font-bold px-3 py-1 rounded text-[11px] uppercase tracking-wider mb-2">
                            {cat.nombre}
                          </div>
                          <div className="space-y-1">
                            {cat.items.map((item) => (
                              <div key={item} className="flex justify-between items-center py-0.5 px-1 bg-white">
                                <span className="text-slate-800 font-medium text-[11.5px]">{item}</span>
                                <span className="font-semibold px-2.5 py-0.5 rounded text-[10.5px] text-emerald-700 bg-emerald-50">Consolidado</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      {rubricasJugadores.slice(2, 4).map((cat) => (
                        <div key={cat.id}>
                          <div className="bg-slate-900 text-white font-bold px-3 py-1 rounded text-[11px] uppercase tracking-wider mb-2">
                            {cat.nombre}
                          </div>
                          <div className="space-y-1">
                            {cat.items.map((item) => (
                              <div key={item} className="flex justify-between items-center py-0.5 px-1 bg-white">
                                <span className="text-slate-800 font-medium text-[11.5px]">{item}</span>
                                <span className="font-semibold px-2.5 py-0.5 rounded text-[10.5px] text-emerald-700 bg-emerald-50">Consolidado</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-500 font-medium">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-700 uppercase">Criterios:</span>
                      <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /><span>Excelente</span></span>
                      <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span>Consolidado</span></span>
                      <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500" /><span>En desarrollo</span></span>
                      <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Necesita apoyo</span></span>
                    </div>
                    <span>Evaluador: {evaluadorNombre} • {clubActivo.nombre}</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}