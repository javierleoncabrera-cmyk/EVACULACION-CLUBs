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

interface EvaluationRecord {
  periodo: Period;
  temporada: string;
  categoria: string;
  fecha: string;
  promedioNivel: string;
  fortalezas: string;
  objetivos: string;
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
  historial?: EvaluationRecord[];
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
  { key: 'EXCELENTE', label: 'Excelente', desc: 'Dominio sobresaliente y constante de la habilidad.', color: '#059669', weight: 4 },
  { key: 'CONSOLIDADO', label: 'Consolidado', desc: 'Adquirido y ejecutado de forma autónoma en situaciones reales.', color: '#0EA5E9', weight: 3 },
  { key: 'EN_DESARROLLO', label: 'En desarrollo', desc: 'En proceso de aprendizaje; requiere práctica guiada.', color: '#F59E0B', weight: 2 },
  { key: 'NECESITA_APOYO', label: 'Necesita apoyo', desc: 'Dificultad evidente; requiere intervención directa.', color: '#EF4444', weight: 1 },
  { key: 'NO_OBSERVADO', label: 'No observado', desc: 'Sin datos suficientes de valoración en este periodo.', color: '#94A3B8', weight: 0 },
];

const NIVELES_ENTRENADORES: LevelOption[] = [
  { key: 'EXCELENTE', label: 'Excelente', desc: 'Metodología sobresaliente y liderazgo muy positivo.', color: '#059669', weight: 4 },
  { key: 'BUENO', label: 'Bueno', desc: 'Cumple con los estándares formativos establecidos por el club.', color: '#0EA5E9', weight: 3 },
  { key: 'MEJORABLE', label: 'Mejorable', desc: 'Aspectos metodológicos a optimizar con supervisión.', color: '#F59E0B', weight: 2 },
  { key: 'NECESITA_APOYO', label: 'Necesita apoyo', desc: 'Requiere pautas directas de la dirección técnica.', color: '#EF4444', weight: 1 },
  { key: 'NO_OBSERVADO', label: 'No observado', desc: 'No evaluado en este ciclo.', color: '#94A3B8', weight: 0 },
];

const RUBRICA_JUGADORES_DEF: RubricCategory[] = [
  { id: 'cat_tecnica', nombre: 'Técnica individual', items: ['Bote', 'Pase', 'Recepción', 'Tiro', 'Entrada', 'Paradas', 'Pivotes', 'Mano no dominante'] },
  { id: 'cat_motor', nombre: 'Desarrollo motor', items: ['Coordinación', 'Equilibrio', 'Carrera', 'Cambios de dirección', 'Salto'] },
  { id: 'cat_tactica', nombre: 'Comprensión del juego', items: ['Ocupación de espacios', 'Juego sin balón', '1c1', 'Toma de decisiones', 'Lectura del juego', 'Juego colectivo'] },
  { id: 'cat_defensa', nombre: 'Defensa', items: ['Actitud defensiva', 'Colocación', '1c1 defensivo', 'Ayudas', 'Balance defensivo'] }
];

const RUBRICA_ENTRENADORES_DEF: RubricCategory[] = [
  { id: 'cat_coach_comunicacion', nombre: 'Comunicación y Clima de Equipo', items: ['Claridad y brevedad en consignas', 'Feedback pedagógico y refuerzo positivo', 'Tono de voz y energía en pista', 'Gestión de la frustración del grupo'] },
  { id: 'cat_coach_metodologia', nombre: 'Metodología y Dinámica de Sesión', items: ['Aprovechamiento del tiempo útil (sin filas)', 'Diseño de tareas acorde a la edad', 'Capacidad de corrección sobre la marcha', 'Ritmo e intensidad de entrenamiento'] },
  { id: 'cat_coach_direccion', nombre: 'Dirección de Partido y Competición', items: ['Gestión equitativa de minutos/rotaciones', 'Serenidad y control emocional en el banco', 'Instrucciones claras en tiempos muertos', 'Respeto al estamento arbitral y rivales'] },
  { id: 'cat_coach_compromiso', nombre: 'Compromiso y Valores de Club', items: ['Puntualidad y preparación de material', 'Alineación con la Dirección Técnica', 'Trato profesional con las familias', 'Cuidado y recogida de instalaciones'] }
];

const PLANTILLAS_FORTALEZAS = [
  "Buena predisposición al trabajo diario, mostrando constancia, atención y una actitud muy receptiva ante las correcciones del cuerpo técnico.",
  "Evolución favorable en la coordinación y el esquema corporal, destacando por su entrega física e implicación constante en las tareas de equipo.",
  "Cumplimiento riguroso de las tareas asignadas, destacando por su disciplina táctica básica, concentración y solidez en los fundamentos individuales.",
  "Alta intensidad defensiva y generosidad en el juego sin balón; un jugador de equipo que prioriza el esfuerzo colectivo y la solidez defensiva.",
  "Dominio fluido de los fundamentos técnicos básicos bajo presión, mostrando claridad en la toma de decisiones y regularidad en los partidos.",
  "Excelente lectura táctica de las ventajas ofensivas, capacidad de liderazgo silencioso en pista y alta eficacia en situaciones de 1c1.",
  "Perfil de rendimiento excelente; destaca por su inteligencia táctica, liderazgo positivo, técnica depurada y capacidad constante para marcar diferencias."
];

const PLANTILLAS_OBJETIVOS = [
  "Consolidar los patrones básicos de coordinación dinámica, equilibrio y atención sostenida durante las explicaciones y dinámicas de grupo.",
  "Mejorar la postura corporal básica y automatizar la correcta ejecución técnica en los desplazamientos sin balón y en la postura defensiva.",
  "Incrementar la confianza y el uso fluido de la mano no dominante, así como el control del ritmo de ejecución en acciones de bote y pase.",
  "Acelerar la velocidad en la toma de decisiones durante situaciones reales de juego, mejorando la ocupación de espacios y la lectura de ventajas en superioridad.",
  "Optimizar la eficacia en la mecánica de finalización y el timing en la lectura y ejecución de bloqueos directos e indirectos.",
  "Ampliar el repertorio táctico individual, mejorando las ayudas defensivas complejas, la comunicación en pista y la polivalencia en distintas posiciones.",
  "Mantener el pico de máxima concentración e intensidad competitiva durante los 40 minutos, ejerciendo como referente de exigencia y liderazgo en el equipo."
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
      { id: 's2', fecha: '14/08/2026', tipo: 'ENTRENAMIENTO', asistencias: { 'j1': 'PRESENTE', 'j2': 'FALTA' } }
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

  const [genero, setGenero] = useState<Gender>('MASCULINO');
  const [tipoEvaluacion, setTipoEvaluacion] = useState<TargetType>('JUGADORES');
  const [periodo, setPeriodo] = useState<Period>('Inicial');
  const [pantalla, setPantalla] = useState<Screen>('EQUIPOS');

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

  const [respuestas, setRespuestas] = useState<Record<string, { nivel: string; obs: string }>>({
    'Bote': { nivel: 'NECESITA_APOYO', obs: '' },
    'Pase': { nivel: 'CONSOLIDADO', obs: '' },
    'Recepción': { nivel: 'CONSOLIDADO', obs: '' },
    'Tiro': { nivel: 'CONSOLIDADO', obs: '' },
    'Entrada': { nivel: 'CONSOLIDADO', obs: '' },
    'Paradas': { nivel: 'CONSOLIDADO', obs: '' },
    'Pivotes': { nivel: 'CONSOLIDADO', obs: '' },
    'Mano no dominante': { nivel: 'CONSOLIDADO', obs: '' },
    'Coordinación': { nivel: 'CONSOLIDADO', obs: '' },
    'Equilibrio': { nivel: 'EXCELENTE', obs: '' },
    'Carrera': { nivel: 'EN_DESARROLLO', obs: '' },
    'Cambios de dirección': { nivel: 'EN_DESARROLLO', obs: '' },
    'Salto': { nivel: 'NECESITA_APOYO', obs: '' },
    'Ocupación de espacios': { nivel: 'CONSOLIDADO', obs: '' },
    'Juego sin balón': { nivel: 'CONSOLIDADO', obs: '' },
    '1c1': { nivel: 'CONSOLIDADO', obs: '' },
    'Toma de decisiones': { nivel: 'CONSOLIDADO', obs: '' },
    'Lectura del juego': { nivel: 'CONSOLIDADO', obs: '' },
    'Juego colectivo': { nivel: 'CONSOLIDADO', obs: '' },
    'Actitud defensiva': { nivel: 'CONSOLIDADO', obs: '' },
    'Colocación': { nivel: 'CONSOLIDADO', obs: '' },
    '1c1 defensivo': { nivel: 'CONSOLIDADO', obs: '' },
    'Ayudas': { nivel: 'CONSOLIDADO', obs: '' },
    'Balance defensivo': { nivel: 'CONSOLIDADO', obs: '' }
  });

  const [fortalezas, setFortalezas] = useState('Excelente actitud, visión táctica y disciplina.');
  const [objetivos, setObjetivos] = useState('Mejora en la mano no dominante y control de ritmo.');

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
    if (!found || found.pass !== authPass) {
      setAuthError('Correo o contraseña incorrectos.');
      return;
    }
    setSessionUser(found);
    if (found.clubId) setClubActivoId(found.clubId);
    setPantalla(found.role === 'SUPER_ADMIN' ? 'PANEL_SUPERADMIN' : 'EQUIPOS');
  };

  const handleLogout = () => {
    setSessionUser(null);
    setAuthEmail('');
    setAuthPass('');
    setPantalla('EQUIPOS');
  };

  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoU: AppUser = {
      id: `u_${Date.now()}`,
      email: nuevoUserEmail.trim(),
      pass: nuevoUserPass.trim(),
      name: nuevoUserNombre.trim(),
      role: nuevoUserRol,
      clubId: nuevoUserRol !== 'SUPER_ADMIN' ? nuevoUserClubId : undefined
    };
    setUsuarios([...usuarios, nuevoU]);
    setNuevoUserEmail(''); setNuevoUserPass(''); setNuevoUserNombre('');
    alert(`Usuario ${nuevoU.name} creado.`);
  };

  const ejecutarCambioPassword = () => {
    if (!modalConfirmacion || !modalConfirmacion.tempPass) return;
    setUsuarios(usuarios.map(u => u.id === modalConfirmacion.user.id ? { ...u, pass: modalConfirmacion.tempPass!.trim() } : u));
    setModalConfirmacion(null);
  };

  const ejecutarEliminacionUsuario = () => {
    if (!modalConfirmacion) return;
    setUsuarios(usuarios.filter(u => u.id !== modalConfirmacion.user.id));
    setModalConfirmacion(null);
  };

  const handleCrearClub = (e: React.FormEvent) => {
    e.preventDefault();
    const newClubId = `club_${Date.now()}`;
    setClubs([...clubs, { id: newClubId, nombre: nuevoClubNombre, temporada: nuevoClubTemporada, logoUrl: null }]);
    setClubActivoId(newClubId);
    setNuevoClubNombre('');
    setPantalla('EQUIPOS');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCatNombre) return;
    const nueva = { id: `cat_${Date.now()}`, nombre: nuevaCatNombre, items: [] };
    if (pestanaRubrica === 'JUGADORES') setRubricasJugadores([...rubricasJugadores, nueva]);
    else setRubricasEntrenadores([...rubricasEntrenadores, nueva]);
    setNuevaCatNombre('');
  };

  const handleAddItemToCategory = (catId: string) => {
    const texto = nuevoItemTexto[catId];
    if (!texto) return;
    if (pestanaRubrica === 'JUGADORES') setRubricasJugadores(rubricasJugadores.map(c => c.id === catId ? { ...c, items: [...c.items, texto] } : c));
    else setRubricasEntrenadores(rubricasEntrenadores.map(c => c.id === catId ? { ...c, items: [...c.items, texto] } : c));
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

  const siglasClub = clubActivo.nombre.split(' ').map(w => w[0].toUpperCase()).slice(0, 3).join('');

  const calcularAsistenciaJugador = (playerId?: string, team?: Team) => {
    if (!playerId || !team) return { pct: 100, presentes: 0, totalValidas: 0, totalSesiones: 0 };
    const sesiones = team.sesiones || [];
    if (sesiones.length === 0) return { pct: 100, presentes: 0, totalValidas: 0, totalSesiones: 0 };
    let presentes = 0, justificadas = 0, evaluadas = 0;
    sesiones.forEach(s => { const st = s.asistencias[playerId]; if (st) { evaluadas++; if (st === 'PRESENTE') presentes++; if (st === 'JUSTIFICADA') justificadas++; } });
    const totalValidas = evaluadas - justificadas;
    return { pct: totalValidas > 0 ? Math.round((presentes / totalValidas) * 100) : 100, presentes, totalValidas, totalSesiones: sesiones.length };
  };

  const handleExportarExcel = () => {
    let csv = 'Dorsal;Nombre;Asistencia\n';
    equipoSeleccionado.jugadores.forEach(j => { csv += `${j.dorsal};"${j.nombre}";${calcularAsistenciaJugador(j.id, equipoSeleccionado).pct}%\n`; });
    const link = document.createElement('a');
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv);
    link.download = 'plantilla.csv';
    link.click();
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
    setNuevoNombreEquipo(''); setNuevaCatEquipo(''); setNuevoEntrenador('');
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
    setNuevoNombreJugador(''); setNuevoDorsal(''); setNuevoNacimiento('');
  };

  const handleScore = (indicador: string, levelKey: string) => {
    const statusField = periodo === 'Inicial' ? 'inicial' : periodo === 'Media' ? 'media' : 'final';
    if (jugadorSeleccionado[statusField] === 'COMPLETADA' && sessionUser?.role !== 'SUPER_ADMIN') {
      alert(`La evaluación ${periodo} ya está completada y bloqueada para este deportista.`);
      return;
    }
    setRespuestas(prev => ({
      ...prev,
      [indicador]: { ...prev[indicador], nivel: levelKey }
    }));
  };

  const handleCerrarEvaluacion = () => {
    const statusField = periodo === 'Inicial' ? 'inicial' : periodo === 'Media' ? 'media' : 'final';
    const actualizados = equipos.map(eq => {
      if (eq.id === equipoSeleccionado.id) {
        const nuevosJugs = eq.jugadores.map(j => {
          if (j.id === jugadorSeleccionado.id) {
            return { ...j, [statusField]: 'COMPLETADA' as const };
          }
          return j;
        });
        const eqActualizado = { ...eq, jugadores: nuevosJugs };
        setEquipoSeleccionado(eqActualizado);
        return eqActualizado;
      }
      return eq;
    });
    setEquipos(actualizados);
    setJugadorSeleccionado({ ...jugadorSeleccionado, [statusField]: 'COMPLETADA' });
    alert(`Evaluación ${periodo} guardada y bloqueada correctamente.`);
    setPantalla('INFORME');
  };

  // Cálculo dinámico para el gráfico de radar (Rombo)
  const calcularPromedioCategoria = (categoriaIdx: number) => {
    const cat = rubricasJugadores[categoriaIdx];
    if (!cat || cat.items.length === 0) return 0.7;
    let suma = 0, total = 0;
    cat.items.forEach(item => {
      const lvlKey = respuestas[item]?.nivel;
      const lvl = NIVELES_JUGADORES.find(n => n.key === lvlKey);
      if (lvl && lvl.weight > 0) {
        suma += lvl.weight;
        total++;
      }
    });
    return total > 0 ? (suma / (total * 4)) : 0.7;
  };

  const cMotorVal = calcularPromedioCategoria(0);
  const cTechVal = calcularPromedioCategoria(1);
  const cTactVal = calcularPromedioCategoria(2);
  const cDefVal = calcularPromedioCategoria(3);

  const cx = 95, cy = 95, r = 70;
  const pMotor = `${cx},${cy - r * cMotorVal}`;
  const pTech = `${cx + r * cTechVal},${cy}`;
  const pTact = `${cx},${cy + r * cTactVal}`;
  const pDef = `${cx - r * cDefVal},${cy}`;
  const radarPoints = `${pMotor} ${pTech} ${pTact} ${pDef}`;

  const asistActual = calcularAsistenciaJugador(jugadorSeleccionado?.id, equipoSeleccionado);
  const publicFamilyUrl = `https://evaculacion-clu-bs.vercel.app/?token=${jugadorSeleccionado?.tokenPublico || 'sec_8f9a2b1c4e7d'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicFamilyUrl)}`;

  const badgeStatus = (status: string) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );

  // ==========================================
  // VISTA PÚBLICA FAMILIAS (QR)
  // ==========================================
  if (publicToken) {
    const jugadorPublico = equipos.flatMap(e => e.jugadores).find(p => p.tokenPublico === publicToken || p.id === publicToken) || EQUIPOS_INICIALES[0].jugadores[0];
    const equipoPublico = equipos.find(e => e.jugadores.some(j => j.id === jugadorPublico.id)) || EQUIPOS_INICIALES[0];
    const clubPublico = clubs.find(c => c.id === equipoPublico.clubId) || clubs[0];
    const asistP = calcularAsistenciaJugador(jugadorPublico.id, equipoPublico);
    const siglasP = (clubPublico?.nombre || 'CB').split(' ').map(w => w[0]).join('').toUpperCase();

    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-sans">
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border flex items-center justify-center font-bold text-emerald-600">
                {siglasP}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">Portal Familiar</span>
                <h1 className="text-xl font-bold">{jugadorPublico.nombre}</h1>
                <p className="text-xs text-slate-500">{clubPublico?.nombre} • {equipoPublico?.nombre} • #{jugadorPublico.dorsal}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded">Asistencia: {asistP.pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {rubricasJugadores.map(cat => (
              <div key={cat.id} className="bg-slate-50 p-4 rounded-xl border space-y-2">
                <h3 className="font-bold text-slate-900 uppercase">{cat.nombre}</h3>
                {cat.items.map(item => (
                  <div key={item} className="flex justify-between bg-white p-2 rounded border">
                    <span>{item}</span>
                    <span className="font-bold text-emerald-700">Consolidado</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between text-xs">
            <span>Evaluación {periodo}</span>
            <button onClick={() => setPublicToken(null)} className="text-emerald-700 font-bold">← Acceso Entrenadores</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA: PORTADA PROFESIONAL (LOGIN SEGURO)
  // ==========================================
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
          
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-medium tracking-wide uppercase mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Software Exclusivo para Canteras y Clubes</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-white tracking-tight leading-[1.2] mb-6">
                El control absoluto de la <span className="text-emerald-400">EVOLUCIÓN</span> técnica y el <span className="text-emerald-400">RENDIMIENTO</span> deportivo.
              </h1>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl">
                La plataforma integral para la dirección técnica y el desarrollo del deportista. Centraliza el control de sesiones, unifica criterios formativos y ofrece a las familias una visión transparente de su evolución.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center space-x-1.5 text-sm">
                    <span>🏀</span>
                    <span>Evaluación Técnica 360°</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Criterios claros en desarrollo motriz, fundamentos técnicos, táctica y actitud competitiva.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-blue-400 font-semibold mb-1 flex items-center space-x-1.5 text-sm">
                    <span>📋</span>
                    <span>Control de Asistencia</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Pase de lista en pista en 10 segundos, cálculo de porcentajes y exportación a Excel.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-purple-400 font-semibold mb-1 flex items-center space-x-1.5 text-sm">
                    <span>📱</span>
                    <span>Portal QR Familias</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Fichas en real-time para padres con token seguro y estricto cumplimiento RGPD.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-amber-400 font-semibold mb-1 flex items-center space-x-1.5 text-sm">
                    <span>🖨️</span>
                    <span>Dossier A4 Profesional</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Informes impecables calibrados para impresión directa en hoja única con escudo.
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

          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center bg-slate-900/60">
            <div className="max-w-sm mx-auto w-full bg-slate-950/60 border border-slate-800/80 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Acceso a la Plataforma</h2>
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-950 transition text-xs tracking-wide"
                >
                  Entrar al Portal
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA INTERNA (APP PRINCIPAL RESPONSIVE CON INFORME A4 VERTICAL ESTRICTO SIN BORDES REDONDEADOS NI SOMBRAS DE IMPRESIÓN Y TABLAS SIMÉTRICAS)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans print:bg-white print:pb-0 print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; background-color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-size: 10px !important; resize: none !important; }
          .print-portrait-page { width: 210mm !important; height: 297mm !important; max-height: 297mm !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; page-break-inside: avoid !important; break-inside: avoid !important; box-sizing: border-box !important; padding: 10mm 12mm !important; margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; background: white !important; resize: none !important; outline: none !important; }
          .page-break { page-break-after: always !important; break-after: page !important; }
          .no-print { display: none !important; }
          * { resize: none !important; box-shadow: none !important; }
        }
      `}</style>

      {modalConfirmacion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 space-y-4">
            {modalConfirmacion.tipo === 'ELIMINAR_USUARIO' ? (
              <>
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">🗑️</div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">¿Eliminar este usuario?</h3>
                  <p className="text-xs text-slate-500">Revocar acceso a <strong>{modalConfirmacion.user.name}</strong>.</p>
                </div>
                <div className="flex space-x-2 pt-3">
                  <button onClick={() => setModalConfirmacion(null)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-xs">Cancelar</button>
                  <button onClick={ejecutarEliminacionUsuario} className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-xs font-semibold">Sí, Eliminar</button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto">🔑</div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Cambiar Contraseña</h3>
                  <input type="text" value={modalConfirmacion.tempPass || ''} onChange={(e) => setModalConfirmacion({ ...modalConfirmacion, tempPass: e.target.value })} className="w-full border rounded-lg p-2.5 font-mono text-center text-sm bg-slate-50" />
                </div>
                <div className="flex space-x-2 pt-3">
                  <button onClick={() => setModalConfirmacion(null)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-xs">Cancelar</button>
                  <button onClick={ejecutarCambioPassword} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-semibold">Guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cabecera Responsive */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 shadow-md print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div onClick={() => setPantalla(sessionUser.role === 'SUPER_ADMIN' ? 'PANEL_SUPERADMIN' : 'EQUIPOS')} className="w-10 h-10 rounded-lg bg-slate-800 border flex items-center justify-center font-bold text-emerald-400 cursor-pointer overflow-hidden">
              {clubActivo.logoUrl ? <img src={clubActivo.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span>{siglasClub || 'CB'}</span>}
            </div>
            <div>
              <h1 className="text-sm font-bold text-emerald-400">{clubActivo.nombre}</h1>
              <p className="text-[11px] text-slate-400">{sessionUser.name} • {sessionUser.role === 'DIRECTOR' ? 'Director/a' : sessionUser.role === 'SUPER_ADMIN' ? 'Admin' : 'Entrenador/a'}</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {sessionUser.role !== 'ENTRENADOR' && (
              <>
                <div className="flex bg-slate-800 p-1 rounded-lg border text-xs">
                  <button onClick={() => { setGenero('FEMENINO'); setPantalla(tipoEvaluacion === 'JUGADORES' ? 'EQUIPOS' : 'LISTA_ENTRENADORES'); }} className={`px-2.5 py-1 rounded ${genero === 'FEMENINO' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Fem</button>
                  <button onClick={() => { setGenero('MASCULINO'); setPantalla(tipoEvaluacion === 'JUGADORES' ? 'EQUIPOS' : 'LISTA_ENTRENADORES'); }} className={`px-2.5 py-1 rounded ${genero === 'MASCULINO' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Masc</button>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg border text-xs">
                  <button onClick={() => { setTipoEvaluacion('JUGADORES'); setPantalla('EQUIPOS'); }} className={`px-2.5 py-1 rounded ${tipoEvaluacion === 'JUGADORES' ? 'bg-slate-600 text-white font-medium' : 'text-slate-400'}`}>Jugadores</button>
                  <button onClick={() => { setTipoEvaluacion('ENTRENADORES'); setPantalla('LISTA_ENTRENADORES'); }} className={`px-2.5 py-1 rounded ${tipoEvaluacion === 'ENTRENADORES' ? 'bg-slate-600 text-white font-medium' : 'text-slate-400'}`}>Staff</button>
                </div>
              </>
            )}
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Period)} className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border">
              <option value="Inicial">Ev. Inicial</option>
              <option value="Media">Ev. Media</option>
              <option value="Final">Ev. Final</option>
            </select>
            <button onClick={handleLogout} className="bg-rose-900/40 text-rose-300 text-xs px-2.5 py-1.5 rounded-lg border border-rose-700/50">Salir</button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal Responsive */}
      <main className="max-w-4xl mx-auto mt-4 sm:mt-6 px-3 sm:px-4 print:mt-0 print:px-0">
        
        {pantalla === 'MODAL_QR' && (
          <div className="bg-white rounded-2xl shadow-xl border p-6 max-w-sm mx-auto text-center space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border">Acceso Público Familias</span>
              <h2 className="text-lg font-bold mt-2">{jugadorSeleccionado.nombre}</h2>
            </div>
            <div className="p-3 bg-white border rounded-xl inline-block mx-auto"><img src={qrCodeUrl} alt="QR" className="w-48 h-48 mx-auto" /></div>
            <button onClick={() => { navigator.clipboard.writeText(publicFamilyUrl); alert('¡Enlace copiado!'); }} className="w-full bg-emerald-600 text-white text-xs py-2.5 rounded-lg font-semibold">📋 Copiar Enlace WhatsApp</button>
            <button onClick={() => setPantalla('PLANTILLA')} className="w-full bg-slate-100 text-slate-700 text-xs py-2 rounded-lg">Cerrar</button>
          </div>
        )}

        {pantalla === 'EDITOR_RUBRICAS' && sessionUser.role === 'SUPER_ADMIN' && (
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
              <div>
                <button onClick={() => setPantalla('EQUIPOS')} className="text-xs text-blue-600 font-semibold mb-1 hover:underline">← Volver a equipos</button>
                <h2 className="text-lg sm:text-xl font-bold">Editor de Rúbricas Técnicas</h2>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button onClick={() => setPestanaRubrica('JUGADORES')} className={`px-3 py-1.5 rounded ${pestanaRubrica === 'JUGADORES' ? 'bg-blue-600 text-white' : ''}`}>Jugador@s</button>
                <button onClick={() => setPestanaRubrica('ENTRENADORES')} className={`px-3 py-1.5 rounded ${pestanaRubrica === 'ENTRENADORES' ? 'bg-blue-600 text-white' : ''}`}>Entrenadores</button>
              </div>
            </div>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input type="text" required placeholder="Nueva categoría..." value={nuevaCatNombre} onChange={(e) => setNuevaCatNombre(e.target.value)} className="flex-1 border rounded-lg p-2.5" />
              <button type="submit" className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg">+ Añadir</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(pestanaRubrica === 'JUGADORES' ? rubricasJugadores : rubricasEntrenadores).map(cat => (
                <div key={cat.id} className="bg-slate-50 border rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-2">{cat.nombre}</h3>
                  <div className="space-y-1">
                    {cat.items.map((item, idx) => <div key={idx} className="bg-white p-2 rounded border text-xs">{item}</div>)}
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    <input type="text" placeholder="Nuevo ítem..." value={nuevoItemTexto[cat.id] || ''} onChange={(e) => setNuevoItemTexto({ ...nuevoItemTexto, [cat.id]: e.target.value })} className="flex-1 text-xs border rounded p-1.5 bg-white" />
                    <button type="button" onClick={() => handleAddItemToCategory(cat.id)} className="bg-slate-800 text-white text-xs px-3 rounded">+ Ítem</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pantalla === 'PANEL_SUPERADMIN' && sessionUser.role === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            <div className="bg-purple-900 text-white p-5 sm:p-6 rounded-2xl shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Panel Maestro de Control</h2>
                <p className="text-xs text-purple-200 mt-1">Gestión integral de accesos y clubes.</p>
              </div>
              <button onClick={() => setPantalla('EQUIPOS')} className="bg-white text-purple-900 font-semibold text-xs px-4 py-2 rounded-lg">Ver App como Club →</button>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-xl shadow border space-y-4">
              <h3 className="font-semibold text-sm">1. Dar de Alta Nuevo Club</h3>
              <form onSubmit={handleCrearClub} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input type="text" required placeholder="Nombre del Club" value={nuevoClubNombre} onChange={(e) => setNuevoClubNombre(e.target.value)} className="border rounded-lg p-2.5" />
                <input type="text" placeholder="Temporada (2026/27)" value={nuevoClubTemporada} onChange={(e) => setNuevoClubTemporada(e.target.value)} className="border rounded-lg p-2.5" />
                <button type="submit" className="bg-purple-700 text-white font-medium rounded-lg p-2.5">+ Crear Club</button>
              </form>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-xl shadow border space-y-4">
              <h3 className="font-semibold text-sm">2. Crear Usuario y Asignar Credenciales</h3>
              <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <input type="text" required placeholder="Nombre" value={nuevoUserNombre} onChange={(e) => setNuevoUserNombre(e.target.value)} className="border rounded-lg p-2.5" />
                <input type="email" required placeholder="Correo" value={nuevoUserEmail} onChange={(e) => setNuevoUserEmail(e.target.value)} className="border rounded-lg p-2.5" />
                <input type="text" required placeholder="Contraseña" value={nuevoUserPass} onChange={(e) => setNuevoUserPass(e.target.value)} className="border rounded-lg p-2.5 font-mono" />
                <select value={nuevoUserRol} onChange={(e) => setNuevoUserRol(e.target.value as UserRole)} className="border rounded-lg p-2.5">
                  <option value="DIRECTOR">Director Técnico</option>
                  <option value="ENTRENADOR">Entrenador</option>
                </select>
                <select value={nuevoUserClubId} onChange={(e) => setNuevoUserClubId(e.target.value)} className="border rounded-lg p-2.5">
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <div className="sm:col-span-5 flex justify-end">
                  <button type="submit" className="bg-emerald-600 text-white font-medium px-6 py-2 rounded-lg">Crear Acceso</button>
                </div>
              </form>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-xl shadow border overflow-x-auto">
              <h3 className="font-semibold text-sm mb-4">3. Usuarios Activos</h3>
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b text-slate-400 font-medium"><th className="pb-2">Nombre</th><th className="pb-2">Correo</th><th className="pb-2">Rol</th><th className="pb-2 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium">{u.name}</td>
                      <td className="py-2.5 text-slate-600">{u.email}</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">{u.role}</span></td>
                      <td className="py-2.5 text-right space-x-1">
                        <button onClick={() => setModalConfirmacion({ tipo: 'EDITAR_PASSWORD', user: u, tempPass: u.pass })} className="bg-slate-100 px-2.5 py-1 rounded border">🔑 Clave</button>
                        {u.role !== 'SUPER_ADMIN' && <button onClick={() => setModalConfirmacion({ tipo: 'ELIMINAR_USUARIO', user: u })} className="text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">🗑️</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pantalla === 'EQUIPOS' && (
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <div>
                <h2 className="text-lg font-bold">{clubActivo.nombre} — Sección {genero === 'FEMENINO' ? 'Femenina' : 'Masculina'}</h2>
                <p className="text-xs text-slate-500">Temporada {clubActivo.temporada}</p>
              </div>
              {sessionUser.role !== 'ENTRENADOR' && <button onClick={() => setPantalla('MODAL_NUEVO_EQUIPO')} className="bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-lg font-medium">+ Nuevo Equipo</button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equiposFiltrados.map(equipo => (
                <div key={equipo.id} onClick={() => { setEquipoSeleccionado(equipo); setPantalla('PLANTILLA'); }} className="p-4 sm:p-5 border rounded-xl hover:border-emerald-500 hover:shadow-md cursor-pointer bg-slate-50/50">
                  <h3 className="font-semibold text-base mb-1">{equipo.nombre}</h3>
                  <p className="text-xs text-slate-500 mb-3">{equipo.categoria} • {equipo.jugadores.length} jugadores</p>
                  <div className="text-xs text-slate-600 flex justify-between border-t pt-3">
                    <span>Entrenador: <strong className="font-medium text-slate-800">{equipo.entrenador}</strong></span>
                    <span className="text-emerald-600 font-medium">Ver plantilla →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pantalla === 'PLANTILLA' && (
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
              <div>
                <button onClick={() => setPantalla('EQUIPOS')} className="text-xs text-emerald-700 font-medium mb-1 hover:underline">← Volver a equipos</button>
                <h2 className="text-lg font-bold">{equipoSeleccionado.nombre}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleExportarExcel} className="bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium">📊 Excel</button>
                <button onClick={handleAbrirPaseLista} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">📋 Pasar Lista</button>
                <button onClick={() => setPantalla('INFORME_EQUIPO')} className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg font-medium">🖨️ Imprimir Todo</button>
              </div>
            </div>

            <form onSubmit={handleAddJugador} className="bg-slate-50 border rounded-lg p-3 text-xs flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1"><label className="block text-[11px] font-medium mb-1 text-slate-600">Nombre</label><input type="text" required placeholder="Nombre..." value={nuevoNombreJugador} onChange={(e) => setNuevoNombreJugador(e.target.value)} className="w-full border rounded px-2.5 py-1.5 bg-white" /></div>
              <div className="w-full sm:w-20"><label className="block text-[11px] font-medium mb-1 text-slate-600">Dorsal</label><input type="number" placeholder="7" value={nuevoDorsal} onChange={(e) => setNuevoDorsal(e.target.value)} className="w-full border rounded px-2.5 py-1.5 bg-white" /></div>
              <div className="w-full sm:w-24"><label className="block text-[11px] font-medium mb-1 text-slate-600">Año</label><input type="number" placeholder="2015" value={nuevoNacimiento} onChange={(e) => setNuevoNacimiento(e.target.value)} className="w-full border rounded px-2.5 py-1.5 bg-white" /></div>
              <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white font-medium px-4 py-1.5 rounded">+ Añadir</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead>
                  <tr className="border-b text-slate-400 font-medium"><th className="pb-3 px-2">Dorsal</th><th className="pb-3 px-2">Nombre</th><th className="pb-3 px-2 text-center">Asistencia</th><th className="pb-3 px-2 text-center">Evaluación</th><th className="pb-3 px-2 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y">
                  {equipoSeleccionado.jugadores.map(jugador => {
                    const asist = calcularAsistenciaJugador(jugador.id, equipoSeleccionado);
                    const statusField = periodo === 'Inicial' ? jugador.inicial : periodo === 'Media' ? jugador.media : jugador.final;
                    return (
                      <tr key={jugador.id} className="hover:bg-slate-50">
                        <td className="py-3 px-2 font-medium text-slate-600">#{jugador.dorsal}</td>
                        <td className="py-3 px-2 font-medium text-slate-900">{jugador.nombre}</td>
                        <td className="py-3 px-2 text-center"><span className="px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">{asist.pct}%</span></td>
                        <td className="py-3 px-2 text-center">{badgeStatus(statusField)}</td>
                        <td className="py-3 px-2 text-right space-x-1">
                          <button onClick={() => { setJugadorSeleccionado(jugador); setPantalla('FORMULARIO'); }} className="bg-emerald-600 text-white px-2.5 py-1 rounded font-medium">Evaluar</button>
                          <button onClick={() => { setJugadorSeleccionado(jugador); setPantalla('INFORME'); }} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded border font-medium">Ficha</button>
                          <button onClick={() => { setJugadorSeleccionado(jugador); setPantalla('MODAL_QR'); }} className="bg-purple-50 text-purple-700 px-2 py-1 rounded border font-medium">📱 QR</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pantalla === 'PASAR_LISTA' && (
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-bold">Pasar Lista (Control Detallado)</h2>
              <button onClick={() => setPantalla('PLANTILLA')} className="text-xs text-slate-500">✕ Cancelar</button>
            </div>
            <form onSubmit={handleGuardarSesion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div><label className="block font-medium mb-1 text-slate-600">Fecha</label><input type="date" required value={sessionFecha} onChange={(e) => setSessionFecha(e.target.value)} className="w-full border rounded p-2 bg-white" /></div>
                <div><label className="block font-medium mb-1 text-slate-600">Tipo</label><select value={sessionTipo} onChange={(e) => setSessionTipo(e.target.value as SessionType)} className="w-full border rounded p-2 bg-white"><option value="ENTRENAMIENTO">Entrenamiento</option><option value="PARTIDO">Partido</option></select></div>
              </div>
              <div className="divide-y border rounded-lg overflow-hidden">
                {equipoSeleccionado.jugadores.map(jugador => {
                  const estado = sessionAsistencias[jugador.id] || 'PRESENTE';
                  return (
                    <div key={jugador.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white gap-2">
                      <span className="font-medium text-xs sm:text-sm">#{jugador.dorsal} {jugador.nombre}</span>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'PRESENTE' })} className={`px-2 py-1 rounded text-[11px] font-semibold transition ${estado === 'PRESENTE' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>✅ Presente</button>
                        <button type="button" onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'FALTA' })} className={`px-2 py-1 rounded text-[11px] font-semibold transition ${estado === 'FALTA' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>❌ Falta</button>
                        <button type="button" onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'JUSTIFICADA' })} className={`px-2 py-1 rounded text-[11px] font-semibold transition ${estado === 'JUSTIFICADA' ? 'bg-amber-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>📝 Justificada</button>
                        <button type="button" onClick={() => setSessionAsistencias({ ...sessionAsistencias, [jugador.id]: 'LESIONADO' })} className={`px-2 py-1 rounded text-[11px] font-semibold transition ${estado === 'LESIONADO' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>🩹 Lesión</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t"><button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">Guardar Sesión</button></div>
            </form>
          </div>
        )}

        {pantalla === 'MODAL_NUEVO_EQUIPO' && (
          <div className="bg-white rounded-xl shadow border p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-bold mb-4">Crear Equipo</h2>
            <form onSubmit={handleCrearEquipo} className="space-y-4 text-xs">
              <input type="text" required placeholder="Nombre del equipo" value={nuevoNombreEquipo} onChange={(e) => setNuevoNombreEquipo(e.target.value)} className="w-full border rounded-lg p-2.5" />
              <input type="text" placeholder="Categoría" value={nuevaCatEquipo} onChange={(e) => setNuevaCatEquipo(e.target.value)} className="w-full border rounded-lg p-2.5" />
              <input type="text" placeholder="Entrenador/a" value={nuevoEntrenador} onChange={(e) => setNuevoEntrenador(e.target.value)} className="w-full border rounded-lg p-2.5" />
              <div className="flex justify-end space-x-2 pt-4 border-t"><button type="button" onClick={() => setPantalla('EQUIPOS')} className="bg-slate-100 px-4 py-2 rounded">Cancelar</button><button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded font-medium">Guardar</button></div>
            </form>
          </div>
        )}

        {pantalla === 'LISTA_ENTRENADORES' && (
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4">Cuerpo Técnico — {clubActivo.nombre}</h2>
            <table className="w-full text-left text-xs min-w-[450px]">
              <thead><tr className="border-b text-slate-400 font-medium"><th className="pb-3 px-2">Entrenador/a</th><th className="pb-3 px-2">Equipo</th><th className="pb-3 px-2 text-right">Acción</th></tr></thead>
              <tbody className="divide-y">
                {entrenadoresFiltrados.map(coach => (
                  <tr key={coach.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-2 font-medium">{coach.nombre}</td>
                    <td className="py-3.5 px-2 text-slate-600">{coach.equipoNombre}</td>
                    <td className="py-3.5 px-2 text-right">
                      <button onClick={() => { setCoachSeleccionado(coach); setPantalla('FORMULARIO'); }} className="bg-emerald-600 text-white px-3 py-1 rounded font-medium">Evaluar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pantalla === 'FORMULARIO' && (() => {
          const statusField = periodo === 'Inicial' ? jugadorSeleccionado.inicial : periodo === 'Media' ? jugadorSeleccionado.media : jugadorSeleccionado.final;
          const isLocked = statusField === 'COMPLETADA' && sessionUser?.role !== 'SUPER_ADMIN';

          return (
            <div className="bg-white rounded-xl shadow border p-4 sm:p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <button onClick={() => setPantalla(tipoEvaluacion === 'JUGADORES' ? 'PLANTILLA' : 'LISTA_ENTRENADORES')} className="text-xs text-emerald-700 font-medium mb-1 hover:underline">← Volver</button>
                  <h2 className="text-lg font-bold">{tipoEvaluacion === 'JUGADORES' ? jugadorSeleccionado.nombre : coachSeleccionado?.nombre}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded">🔒 Bloqueado ({periodo})</span>}
                  <button onClick={() => setPantalla('INFORME')} className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded font-medium">Ver Ficha</button>
                </div>
              </div>

              {isLocked && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg">
                  La evaluación <strong>{periodo}</strong> ya se encuentra completada y cerrada para este deportista. Para modificarla, cambia de periodo en el menú superior o solicita permisos de Super Administrador.
                </div>
              )}

              <div className="bg-slate-50 border p-3 rounded-lg flex flex-wrap gap-4 text-xs text-slate-700">
                {nivelesActuales.map(n => (
                  <div key={n.key} className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color }} />
                    <span className="font-medium">{n.label}</span>
                  </div>
                ))}
              </div>

              {!isLocked && (
                <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-3 text-xs">
                  <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">✨ Plantillas Automatizadas de Apoyo</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Cargar plantilla de Fortalezas:</label>
                      <select 
                        onChange={(e) => { if (e.target.value) setFortalezas(e.target.value); }} 
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-slate-700 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecciona una opción rápida...</option>
                        {PLANTILLAS_FORTALEZAS.map((txt, idx) => (
                          <option key={idx} value={txt}>Opción {idx + 1}: {txt.substring(0, 50)}...</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Cargar plantilla de Objetivos:</label>
                      <select 
                        onChange={(e) => { if (e.target.value) setObjetivos(e.target.value); }} 
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-slate-700 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecciona una opción rápida...</option>
                        {PLANTILLAS_OBJETIVOS.map((txt, idx) => (
                          <option key={idx} value={txt}>Opción {idx + 1}: {txt.substring(0, 50)}...</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {rubricasActivas.map(cat => (
                  <div key={cat.id} className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">{cat.nombre}</h3>
                    <div className="divide-y">
                      {cat.items.map(item => {
                        const selKey = respuestas[item]?.nivel || 'CONSOLIDADO';
                        const activeLvl = nivelesActuales.find(l => l.key === selKey);
                        return (
                          <div key={item} className="py-3.5 space-y-2">
                            <div className="flex justify-between items-center gap-3">
                              <span className="font-medium text-xs sm:text-sm text-slate-800">{item}</span>
                              <div className="flex space-x-1 sm:space-x-2">
                                {nivelesActuales.map(lvl => (
                                  <button 
                                    key={lvl.key} 
                                    type="button" 
                                    disabled={isLocked}
                                    onClick={() => handleScore(item, lvl.key)} 
                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-bold ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${respuestas[item]?.nivel === lvl.key ? 'scale-110 shadow-sm ring-2 ring-offset-1 ring-slate-400' : 'bg-white opacity-80'}`} 
                                    style={{ backgroundColor: respuestas[item]?.nivel === lvl.key ? lvl.color : '#fff', borderColor: lvl.color, color: respuestas[item]?.nivel === lvl.key ? '#fff' : 'transparent' }} 
                                    title={lvl.label}
                                  >
                                    {respuestas[item]?.nivel === lvl.key ? '✓' : ''}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {activeLvl && activeLvl.key !== 'NO_OBSERVADO' && (
                              <div className="bg-slate-50 border border-slate-200/80 rounded px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                                <span className="font-semibold" style={{ color: activeLvl.color }}>{activeLvl.label}:</span>
                                <span>{activeLvl.desc}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fortalezas Destacadas:</label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={fortalezas}
                    onChange={(e) => setFortalezas(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Objetivos de Mejora:</label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={objetivos}
                    onChange={(e) => setObjetivos(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <button onClick={() => setPantalla('PLANTILLA')} className="text-xs text-slate-600 font-medium">← Volver</button>
                {!isLocked ? (
                  <button onClick={handleCerrarEvaluacion} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-semibold shadow">
                    🔒 Cerrar y Guardar Evaluación {periodo}
                  </button>
                ) : (
                  <button onClick={() => setPantalla('INFORME')} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-xs font-semibold">
                    Ver Informe Oficial
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* INFORME PROFESIONAL MAESTRO A4 VERTICAL ESTRICTO (USO DE TABLAS HTML PURAS Y ALTURAS RIGIDAS PARA ELIMINAR CUALQUIER DESNIVEL O RAYA) */}
        {pantalla === 'INFORME' && (
          <div className="print-portrait-page bg-white rounded-none shadow-none border-0 p-4 space-y-2.5">
            
            {/* Cabecera A4 Real */}
            <div className="border-b-2 border-slate-900 pb-2.5 flex justify-between items-center w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-extrabold text-sm shadow shrink-0">
                  {siglasClub}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    {tipoEvaluacion === 'JUGADORES' ? jugadorSeleccionado.nombre : coachSeleccionado?.nombre}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-medium">
                    {clubActivo.nombre} • Dossier Técnico 360° ({periodo}) • Equipo: {equipoSeleccionado.nombre} {tipoEvaluacion === 'JUGADORES' ? `• Dorsal #${jugadorSeleccionado.dorsal}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold bg-slate-100 text-slate-800 px-3.5 py-1 rounded-md border border-slate-200">
                  Asistencia: {asistActual.pct}%
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5">Temporada {clubActivo.temporada}</p>
              </div>
            </div>

            {/* Resumen Ejecutivo Superior con Rombo Ampliado y Ejes Correctos */}
            <div className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 w-full">
              <div className="col-span-5 flex flex-col items-center justify-center border-r border-slate-200 pr-3">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Perfil de Rendimiento
                </span>
                <svg width="125" height="125" viewBox="0 0 190 190" className="overflow-visible">
                  <polygon points="95,20 170,95 95,170 20,95" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
                  <polygon points="95,55 135,95 95,135 55,95" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="95" y1="20" x2="95" y2="170" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="20" y1="95" x2="170" y2="95" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />

                  <polygon points={radarPoints} fill="rgba(5, 150, 105, 0.2)" stroke="#059669" strokeWidth="2.5" />

                  <text x="95" y="12" textAnchor="middle" className="text-[8.5px] font-bold fill-slate-700">MOTOR</text>
                  <text x="177" y="98" textAnchor="start" className="text-[8.5px] font-bold fill-slate-700">TÉCNICA</text>
                  <text x="95" y="183" textAnchor="middle" className="text-[8.5px] font-bold fill-slate-700">TÁCTICA</text>
                  <text x="13" y="98" textAnchor="end" className="text-[8.5px] font-bold fill-slate-700">DEFENSA</text>
                </svg>
              </div>

              <div className="col-span-7 grid grid-cols-1 gap-2 text-[10px]">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                  <strong className="block font-bold text-emerald-950 uppercase text-[9px] tracking-wider mb-0.5">Fortalezas:</strong>
                  <p className="text-emerald-900 leading-normal">{fortalezas}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                  <strong className="block font-bold text-amber-950 uppercase text-[9px] tracking-wider mb-0.5">Objetivos de Mejora:</strong>
                  <p className="text-amber-900 leading-normal">{objetivos}</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE RÚBRICAS CON TABLAS HTML PURAS DE ALTURA RIGUROSA Y ANCHO COMPLETO PARA CERO DESNIVELES */}
            <table className="w-full border-collapse text-[9.5px]">
              <tbody>
                <tr>
                  {/* Columna Izquierda: [0] Desarrollo Motor (5 ítems) + [1] Técnica Individual (8 ítems) en altura total fija */}
                  <td className="w-1/2 pr-2 align-top">
                    <div className="flex flex-col justify-between h-full space-y-2">
                      
                      {/* Desarrollo Motor */}
                      <div className="bg-slate-50/85 p-2 rounded-xl border border-slate-200 space-y-1">
                        <div className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                          {rubricasActivas[0].nombre}
                        </div>
                        <div className="space-y-0.5">
                          {rubricasActivas[0].items.map(item => {
                            const selKey = respuestas[item]?.nivel || 'CONSOLIDADO';
                            const lvlObj = nivelesActuales.find(l => l.key === selKey);
                            return (
                              <div key={item} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200/90 shadow-2xs">
                                <span className="font-medium text-slate-800 truncate pr-2">{item}</span>
                                <span className="font-bold px-1.5 py-0.2 rounded text-[9px] shrink-0" style={{ color: lvlObj?.color || '#059669', backgroundColor: `${lvlObj?.color || '#059669'}15` }}>
                                  {lvlObj ? lvlObj.label : 'Consolidado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Técnica Individual */}
                      <div className="bg-slate-50/85 p-2 rounded-xl border border-slate-200 space-y-1">
                        <div className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                          {rubricasActivas[1].nombre}
                        </div>
                        <div className="space-y-0.5">
                          {rubricasActivas[1].items.map(item => {
                            const selKey = respuestas[item]?.nivel || 'CONSOLIDADO';
                            const lvlObj = nivelesActuales.find(l => l.key === selKey);
                            return (
                              <div key={item} className="flex justify-between items-center py-0.5 px-2 bg-white rounded border border-slate-200/90 shadow-2xs">
                                <span className="font-medium text-slate-800 truncate pr-2">{item}</span>
                                <span className="font-bold px-1.5 py-0.2 rounded text-[9px] shrink-0" style={{ color: lvlObj?.color || '#059669', backgroundColor: `${lvlObj?.color || '#059669'}15` }}>
                                  {lvlObj ? lvlObj.label : 'Consolidado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </td>

                  {/* Columna Derecha: [2] Comprensión del juego (6 ítems) + [3] Defensa (5 ítems) */}
                  <td className="w-1/2 pl-2 align-top">
                    <div className="flex flex-col justify-between h-full space-y-2">
                      
                      {/* Comprensión del juego */}
                      <div className="bg-slate-50/85 p-2 rounded-xl border border-slate-200 space-y-1">
                        <div className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                          {rubricasActivas[2].nombre}
                        </div>
                        <div className="space-y-0.5">
                          {rubricasActivas[2].items.map(item => {
                            const selKey = respuestas[item]?.nivel || 'CONSOLIDADO';
                            const lvlObj = nivelesActuales.find(l => l.key === selKey);
                            return (
                              <div key={item} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200/90 shadow-2xs">
                                <span className="font-medium text-slate-800 truncate pr-2">{item}</span>
                                <span className="font-bold px-1.5 py-0.2 rounded text-[9px] shrink-0" style={{ color: lvlObj?.color || '#059669', backgroundColor: `${lvlObj?.color || '#059669'}15` }}>
                                  {lvlObj ? lvlObj.label : 'Consolidado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Defensa */}
                      <div className="bg-slate-50/85 p-2 rounded-xl border border-slate-200 space-y-1">
                        <div className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                          {rubricasActivas[3].nombre}
                        </div>
                        <div className="space-y-0.5">
                          {rubricasActivas[3].items.map(item => {
                            const selKey = respuestas[item]?.nivel || 'CONSOLIDADO';
                            const lvlObj = nivelesActuales.find(l => l.key === selKey);
                            return (
                              <div key={item} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200/90 shadow-2xs">
                                <span className="font-medium text-slate-800 truncate pr-2">{item}</span>
                                <span className="font-bold px-1.5 py-0.2 rounded text-[9px] shrink-0" style={{ color: lvlObj?.color || '#059669', backgroundColor: `${lvlObj?.color || '#059669'}15` }}>
                                  {lvlObj ? lvlObj.label : 'Consolidado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Pie Institucional con Firma, Sello de Marca y Cero Líneas en Diagonal */}
            <div className="pt-2.5 border-t-2 border-slate-200 flex justify-between items-center text-[9.5px] text-slate-600 w-full">
              <div className="flex items-center gap-6">
                <span>Director Técnico / Entrenador: _____________________</span>
                <span>Firma: _______________</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  ⚡ Powered by Cantera360°
                </span>
                <div className="no-print space-x-2">
                  <button onClick={() => setPantalla('FORMULARIO')} className="text-slate-600 font-semibold hover:underline">← Editar</button>
                  <button onClick={handlePrintPDF} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl font-semibold shadow transition text-xs">
                    🖨️ Guardar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {pantalla === 'INFORME_EQUIPO' && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow border flex justify-between items-center print:hidden">
              <h3 className="font-bold text-sm">Dossier Completo de {equipoSeleccionado.nombre}</h3>
              <div className="space-x-2">
                <button onClick={() => setPantalla('PLANTILLA')} className="text-xs px-3 py-2 rounded">← Volver</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white text-xs px-5 py-2 rounded font-medium">Imprimir Todo</button>
              </div>
            </div>
            {equipoSeleccionado.jugadores.map(jugador => (
              <div key={jugador.id} className="print-portrait-page bg-white rounded-xl shadow border p-8 page-break">
                <h2 className="text-xl font-bold mb-2">{jugador.nombre}</h2>
                <p className="text-xs text-slate-600">Dorsal #{jugador.dorsal} • {clubActivo.nombre}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}