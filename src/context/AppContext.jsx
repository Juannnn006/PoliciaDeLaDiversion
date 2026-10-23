import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  getDocs,
  writeBatch,
  increment
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AppContext = createContext(null);

const isRealFirebaseConfigured = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGzfIAwgphWVEed84hVVwXgph6MHQ31mw";
  return Boolean(key && key !== 'demo-api-key');
};

// Avatar colors palette
const AVATAR_COLORS = [
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #f43f5e, #e11d48)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #f97316, #ea580c)',
];

export function getAvatarColor(index) {
  return AVATAR_COLORS[Math.abs(index || 0) % AVATAR_COLORS.length];
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Strict member deduplication helper
export function deduplicateMembers(list) {
  if (!Array.isArray(list)) return [];
  const result = [];
  const seenIds = new Set();
  const seenNames = new Set();
  for (const m of list) {
    if (!m) continue;
    const cleanId = String(m.id || '').trim();
    const cleanName = String(m.displayName || '').trim().toLowerCase();
    if (cleanId && seenIds.has(cleanId)) continue;
    if (cleanName && seenNames.has(cleanName)) continue;
    if (cleanId) seenIds.add(cleanId);
    if (cleanName) seenNames.add(cleanName);
    result.push(m);
  }
  return result;
}

// Initial realistic demo state
const INITIAL_DEMO_MEMBERS = [
  { id: 'user-javi', displayName: 'Javi Pérez', email: 'javi@amigos.es', points: 45, groupId: 'DIVERSION-DEMO', avatarIndex: 2 },
  { id: 'user-sofi', displayName: 'Sofía Ramos', email: 'sofi@amigos.es', points: 20, groupId: 'DIVERSION-DEMO', avatarIndex: 1 },
  { id: 'user-dani', displayName: 'Dani Moreno', email: 'dani@amigos.es', points: 12, groupId: 'DIVERSION-DEMO', avatarIndex: 0 },
  { id: 'user-carmen', displayName: 'Carmen Soto', email: 'carmen@amigos.es', points: 5, groupId: 'DIVERSION-DEMO', avatarIndex: 4 },
  { id: 'user-laura', displayName: 'Laura Gil', email: 'laura@amigos.es', points: 0, groupId: 'DIVERSION-DEMO', avatarIndex: 5 },
];

const INITIAL_DEMO_POLLS = [
  {
    id: 'poll-1',
    groupId: 'DIVERSION-DEMO',
    question: '¿Quién dijo "yo a las 23:30 me recojo que mañana tengo que hacer cosas"?',
    createdBy: 'user-dani',
    createdByName: 'Dani Moreno',
    targetMemberId: 'user-javi',
    targetMemberName: 'Javi Pérez',
    sanctionType: 'penalty',
    sanctionPoints: 10,
    votesFor: ['user-dani', 'user-sofi'],
    votesAgainst: [],
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 4),
    expiresAt: new Date(Date.now() + 3600000 * 20).toISOString(),
  },
  {
    id: 'poll-2',
    groupId: 'DIVERSION-DEMO',
    question: '¿Quién pidió una ronda de tequilas cuando el ambiente estaba apagado?',
    createdBy: 'user-javi',
    createdByName: 'Javi Pérez',
    targetMemberId: 'user-laura',
    targetMemberName: 'Laura Gil',
    sanctionType: 'reward',
    sanctionPoints: 5,
    votesFor: ['user-javi', 'user-carmen', 'user-sofi'],
    votesAgainst: [],
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 8),
    expiresAt: new Date(Date.now() + 3600000 * 16).toISOString(),
  }
];

const INITIAL_DEMO_PUNISHMENTS = [
  {
    id: 'punish-1',
    groupId: 'DIVERSION-DEMO',
    month: '2026-10',
    memberId: 'user-javi',
    memberName: 'Javi Pérez',
    description: 'Pagar la primera ronda de cervezas y llevar gorro ridículo de policía toda la noche',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 48),
  },
  {
    id: 'punish-2',
    groupId: 'DIVERSION-DEMO',
    month: '2026-09',
    memberId: 'user-dani',
    memberName: 'Dani Moreno',
    description: 'Bailar una canción de reggaeton encima de la silla y traer los hielos',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 720),
  }
];

const INITIAL_DEMO_ACTIVITIES = [
  {
    id: 'act-1',
    groupId: 'DIVERSION-DEMO',
    type: 'vote',
    text: 'Dani Moreno ha propuesto una votación contra Javi Pérez: "¿Quién dijo que a las 23:30 se recogía?"',
    createdAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: 'act-2',
    groupId: 'DIVERSION-DEMO',
    type: 'penalty',
    text: 'Votación aprobada: Javi Pérez recibió +15 puntos por cancelar el plan del fin de semana',
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: 'act-3',
    groupId: 'DIVERSION-DEMO',
    type: 'punishment',
    text: 'Se ha asignado el castigo mensual a Javi Pérez: "Pagar la primera ronda y llevar gorro de policía"',
    createdAt: new Date(Date.now() - 3600000 * 48),
  }
];

export function AppProvider({ children }) {
  const [useFirebase] = useState(isRealFirebaseConfigured());
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('ranking');

  const [members, setMembers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activities, setActivities] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast system
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Initialize demo data or load from localStorage
  const loadDemoData = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('pdd_demo_user');
      const storedMembers = localStorage.getItem('pdd_demo_members');
      const storedPolls = localStorage.getItem('pdd_demo_polls');
      const storedPunishments = localStorage.getItem('pdd_demo_punishments');
      const storedActivities = localStorage.getItem('pdd_demo_activities');
      const storedNotifs = localStorage.getItem('pdd_demo_notifs');

      const rawMembers = storedMembers ? JSON.parse(storedMembers) : INITIAL_DEMO_MEMBERS;
      const loadedMembers = deduplicateMembers(rawMembers);
      loadedMembers.sort((a, b) => b.points - a.points);
      setMembers(loadedMembers);

      setPolls(storedPolls ? JSON.parse(storedPolls) : INITIAL_DEMO_POLLS);
      setPunishments(storedPunishments ? JSON.parse(storedPunishments) : INITIAL_DEMO_PUNISHMENTS);
      setActivities(storedActivities ? JSON.parse(storedActivities) : INITIAL_DEMO_ACTIVITIES);
      setNotifications(storedNotifs ? JSON.parse(storedNotifs) : [
        {
          id: 'notif-1',
          text: '🚨 ¡Javi Pérez encabeza el ranking como Policía de la Diversión!',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          id: 'notif-2',
          text: '🗳️ Tienes una votación pendiente: "¿Quién canceló el plan?"',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 5),
        }
      ]);

      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser({ uid: u.id, email: u.email });
        setUserProfile(u);
        setGroupId(u.groupId);
        if (u.groupId && u.groupId !== 'DIVERSION-DEMO') {
          const groupMembers = loadedMembers.filter(m => m.groupId === u.groupId);
          setMembers(groupMembers.length > 0 ? groupMembers : [u]);
        }
      }
    } catch {
      setMembers(INITIAL_DEMO_MEMBERS);
      setPolls(INITIAL_DEMO_POLLS);
      setPunishments(INITIAL_DEMO_PUNISHMENTS);
      setActivities(INITIAL_DEMO_ACTIVITIES);
    }
  }, []);

  const saveDemoState = (updatedMembers, updatedPolls, updatedPunishments, updatedActivities, updatedNotifs) => {
    if (updatedMembers) {
      const deduped = deduplicateMembers(updatedMembers);
      localStorage.setItem('pdd_demo_members', JSON.stringify(deduped));
    }
    if (updatedPolls) localStorage.setItem('pdd_demo_polls', JSON.stringify(updatedPolls));
    if (updatedPunishments) localStorage.setItem('pdd_demo_punishments', JSON.stringify(updatedPunishments));
    if (updatedActivities) localStorage.setItem('pdd_demo_activities', JSON.stringify(updatedActivities));
    if (updatedNotifs) localStorage.setItem('pdd_demo_notifs', JSON.stringify(updatedNotifs));
  };

  // Auth Listener
  useEffect(() => {
    if (!useFirebase) {
      loadDemoData();
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (profileDoc.exists()) {
              const profile = { id: firebaseUser.uid, ...profileDoc.data() };
              setUserProfile(profile);
              setGroupId(profile.groupId);
            }
          } catch (err) {
            console.warn('Firestore profile fetch error:', err.message);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setGroupId(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase init fallback:', e.message);
      loadDemoData();
      setLoading(false);
    }
  }, [useFirebase, loadDemoData]);

  // Firestore listeners when real Firebase is active
  useEffect(() => {
    if (!useFirebase || !groupId) return;

    const qMembers = query(
      collection(db, 'users'),
      where('groupId', '==', groupId),
      orderBy('points', 'desc')
    );
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const membersData = snapshot.docs.map((docSnap, index) => ({
        id: docSnap.id,
        ...docSnap.data(),
        rank: index + 1,
        avatarColor: getAvatarColor(index),
      }));
      setMembers(deduplicateMembers(membersData));
    }, (err) => console.warn('Snapshot error:', err.message));

    const qPolls = query(
      collection(db, 'polls'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const unsubPolls = onSnapshot(qPolls, (snapshot) => {
      const pollsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setPolls(pollsData);
    }, (err) => console.warn('Polls snapshot error:', err.message));

    const qActivities = query(
      collection(db, 'activities'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      const actData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setActivities(actData);
    }, (err) => console.warn('Activities snapshot error:', err.message));

    const qPunishments = query(
      collection(db, 'punishments'),
      where('groupId', '==', groupId),
      orderBy('month', 'desc')
    );
    const unsubPunishments = onSnapshot(qPunishments, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setPunishments(data);
    }, (err) => console.warn('Punishments snapshot error:', err.message));

    return () => {
      unsubMembers();
      unsubPolls();
      unsubActivities();
      unsubPunishments();
    };
  }, [useFirebase, groupId]);

  // Quick switch or demo login
  const loginAsDemoUser = (userIndex = 2) => {
    const currentMembers = deduplicateMembers(members.length > 0 ? members : INITIAL_DEMO_MEMBERS);
    const target = currentMembers[userIndex] || currentMembers[0] || INITIAL_DEMO_MEMBERS[2];
    setUser({ uid: target.id, email: target.email });
    setUserProfile(target);
    setGroupId(target.groupId || 'DIVERSION-DEMO');
    setActiveTab('ranking');
    localStorage.setItem('pdd_demo_user', JSON.stringify(target));
    addToast(`Sesión iniciada como ${target.displayName}. ¡Entrando al grupo!`, 'success');
  };

  // Auth functions
  const login = async (email, password) => {
    if (!useFirebase) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const currentMembers = deduplicateMembers(members.length > 0 ? members : INITIAL_DEMO_MEMBERS);
      const found = currentMembers.find(m => m.email && m.email.toLowerCase() === cleanEmail);

      if (found) {
        setUser({ uid: found.id, email: found.email });
        setUserProfile(found);
        setGroupId(found.groupId || 'DIVERSION-DEMO');
        setActiveTab('ranking');
        localStorage.setItem('pdd_demo_user', JSON.stringify(found));
        addToast(`Bienvenido de nuevo, ${found.displayName}. Redirigiendo a tu grupo...`, 'success');
        return found;
      }

      const displayName = cleanEmail.split('@')[0];
      const newUser = {
        id: `user-${displayName.toLowerCase().replace(/\s+/g, '')}`,
        displayName,
        email: cleanEmail,
        points: 0,
        groupId: 'DIVERSION-DEMO',
        avatarIndex: currentMembers.length,
      };

      const updated = deduplicateMembers([...currentMembers, newUser]);
      updated.sort((a, b) => b.points - a.points);
      setMembers(updated);
      setUser({ uid: newUser.id, email: newUser.email });
      setUserProfile(newUser);
      setGroupId('DIVERSION-DEMO');
      setActiveTab('ranking');
      localStorage.setItem('pdd_demo_user', JSON.stringify(newUser));
      saveDemoState(updated);
      addToast(`Bienvenido ${displayName}, has entrado a tu grupo.`, 'success');
      return newUser;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profileDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (profileDoc.exists()) {
      const p = { id: cred.user.uid, ...profileDoc.data() };
      setUserProfile(p);
      if (p.groupId) {
        setGroupId(p.groupId);
        setActiveTab('ranking');
      }
    }
    return cred.user;
  };

  const register = async (email, password, displayName) => {
    const cleanName = (displayName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!useFirebase) {
      const currentMembers = deduplicateMembers(members.length > 0 ? members : INITIAL_DEMO_MEMBERS);
      // Check if user already exists
      const existing = currentMembers.find(m => 
        (m.email && m.email.toLowerCase() === cleanEmail) ||
        (m.displayName && m.displayName.toLowerCase() === cleanName.toLowerCase())
      );
      if (existing) {
        setUser({ uid: existing.id, email: existing.email });
        setUserProfile(existing);
        setGroupId(existing.groupId || 'DIVERSION-DEMO');
        setActiveTab('ranking');
        localStorage.setItem('pdd_demo_user', JSON.stringify(existing));
        addToast(`Ya estabas registrado como ${existing.displayName}. Redirigiendo a tu grupo...`, 'info');
        return existing;
      }

      const newUser = {
        id: 'user-' + Date.now(),
        displayName: cleanName,
        email: cleanEmail,
        points: 0,
        groupId: null,
        avatarIndex: currentMembers.length,
      };
      return newUser;
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(cred.user, { displayName: cleanName });
    return cred.user;
  };

  const logout = async () => {
    if (!useFirebase) {
      localStorage.removeItem('pdd_demo_user');
      setUser(null);
      setUserProfile(null);
      setGroupId(null);
      setActiveTab('ranking');
      addToast('Sesión cerrada', 'info');
      return;
    }

    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setMembers([]);
    setPolls([]);
    setActivities([]);
    setPunishments([]);
    setNotifications([]);
    setGroupId(null);
    setActiveTab('ranking');
  };

  const createGroup = async (name, userId, displayName) => {
    const cleanGroupName = (name || '').trim() || 'Mi Grupo';
    const cleanDisplayName = (displayName || '').trim() || 'Admin';

    if (!useFirebase) {
      const newGroupId = 'GRUPO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const profile = {
        id: userId || `user-${Date.now()}`,
        displayName: cleanDisplayName,
        email: user?.email || `${cleanDisplayName.toLowerCase()}@amigos.es`,
        points: 0,
        groupId: newGroupId,
        avatarIndex: 0,
      };
      const newMemberList = [profile];
      setMembers(newMemberList);
      setUser({ uid: profile.id, email: profile.email });
      setUserProfile(profile);
      setGroupId(newGroupId);
      setActiveTab('ranking');
      localStorage.setItem('pdd_demo_user', JSON.stringify(profile));
      saveDemoState(newMemberList, [], [], [], []);
      addToast(`¡Grupo "${cleanGroupName}" creado! Código: ${newGroupId}`, 'success');
      return newGroupId;
    }

    const cleanGroupId = 'GRUPO-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const effectiveUserId = userId || auth.currentUser?.uid || user?.uid || `user-${Date.now()}`;

    await setDoc(doc(db, 'groups', cleanGroupId), {
      id: cleanGroupId,
      name: cleanGroupName,
      createdBy: effectiveUserId,
      createdAt: serverTimestamp(),
      members: [effectiveUserId],
    });
    
    await setDoc(doc(db, 'users', effectiveUserId), {
      displayName: cleanDisplayName,
      email: auth.currentUser?.email || `${cleanDisplayName.toLowerCase()}@amigos.es`,
      points: 0,
      groupId: cleanGroupId,
      joinedAt: serverTimestamp(),
      avatarIndex: 0,
    });

    setUser({ uid: effectiveUserId, email: `${cleanDisplayName.toLowerCase()}@amigos.es` });
    setGroupId(cleanGroupId);
    setUserProfile({
      id: effectiveUserId,
      displayName: cleanDisplayName,
      email: `${cleanDisplayName.toLowerCase()}@amigos.es`,
      points: 0,
      groupId: cleanGroupId,
      avatarIndex: 0,
    });
    setActiveTab('ranking');
    addToast(`¡Grupo "${cleanGroupName}" creado! Código: ${cleanGroupId}`, 'success');

    return cleanGroupId;
  };

  // Join group without duplicate logins and with immediate tab redirect
  const joinGroup = async (rawCode, rawUserId, rawDisplayName, rawEmail) => {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      throw new Error('Debes introducir un código de grupo');
    }

    const cleanDisplayName = (rawDisplayName || userProfile?.displayName || '').trim() || 'Amigo';
    const cleanEmail = (rawEmail || user?.email || `${cleanDisplayName.toLowerCase().replace(/\s+/g, '')}@amigos.es`).toLowerCase();
    const cleanUserId = rawUserId || user?.uid || `user-${cleanDisplayName.toLowerCase().replace(/\s+/g, '')}`;

    if (!useFirebase) {
      const isDemoGroup = code === 'DIVERSION-DEMO';
      
      let storedAll = [];
      try {
        const raw = localStorage.getItem('pdd_demo_members');
        if (raw) storedAll = JSON.parse(raw);
      } catch (e) {
        console.warn('Storage read error', e);
      }

      let currentMembers = isDemoGroup 
        ? deduplicateMembers(members.length > 0 ? members : INITIAL_DEMO_MEMBERS)
        : deduplicateMembers(storedAll.filter(m => m.groupId === code));

      // Check if this member is ALREADY in the group (avoiding duplicate logins!)
      const existingMember = currentMembers.find(m => 
        (m.id && m.id === cleanUserId) ||
        (m.email && m.email.toLowerCase() === cleanEmail) ||
        (m.displayName && m.displayName.trim().toLowerCase() === cleanDisplayName.toLowerCase())
      );

      if (existingMember) {
        // User is already a member: DO NOT DUPLICATE!
        const updatedProfile = { ...existingMember, groupId: code };
        setUser({ uid: existingMember.id, email: existingMember.email });
        setUserProfile(updatedProfile);
        setGroupId(code);
        setMembers(currentMembers);
        setActiveTab('ranking'); // Instant redirect to group tab
        localStorage.setItem('pdd_demo_user', JSON.stringify(updatedProfile));
        addToast(`¡Bienvenido de nuevo, ${existingMember.displayName}!`, 'info');
        return code;
      }

      // New unique member
      const newMember = {
        id: cleanUserId,
        displayName: cleanDisplayName,
        email: cleanEmail,
        points: 0,
        groupId: code,
        avatarIndex: currentMembers.length,
      };

      const updatedGroupMembers = deduplicateMembers([...currentMembers, newMember]);
      updatedGroupMembers.sort((a, b) => b.points - a.points);
      
      // Update global members list in storage
      const otherGroupMembers = storedAll.filter(m => m.groupId !== code);
      const allMembersToSave = isDemoGroup 
        ? updatedGroupMembers 
        : deduplicateMembers([...otherGroupMembers, ...updatedGroupMembers]);

      setMembers(updatedGroupMembers);
      setUser({ uid: newMember.id, email: newMember.email });
      setUserProfile(newMember);
      setGroupId(code);
      setActiveTab('ranking'); // Instant redirect to group tab
      localStorage.setItem('pdd_demo_user', JSON.stringify(newMember));
      saveDemoState(allMembersToSave);

      addToast(`¡Te has unido al grupo ${code}!`, 'success');
      return code;
    }

    // Real Firebase Mode
    const groupDoc = await getDoc(doc(db, 'groups', code));
    if (!groupDoc.exists()) {
      throw new Error(`No existe ningún grupo con el código "${code}". Comprueba que esté bien escrito.`);
    }

    const groupData = groupDoc.data();
    const currentMemberIds = groupData.members || [];
    const effectiveUserId = rawUserId || auth.currentUser?.uid || user?.uid || `user-${cleanDisplayName.toLowerCase().replace(/\s+/g, '')}`;

    const userDocRef = doc(db, 'users', effectiveUserId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Already in group: avoid duplicate entry & keep existing score
      if (userData.groupId === code) {
        setUser({ uid: effectiveUserId, email: userData.email || cleanEmail });
        setGroupId(code);
        setUserProfile({ id: effectiveUserId, ...userData });
        setActiveTab('ranking'); // Instant redirect to group tab
        addToast(`¡Bienvenido de nuevo, ${userData.displayName || cleanDisplayName}!`, 'info');
        return code;
      }
    }

    if (!currentMemberIds.includes(effectiveUserId)) {
      await updateDoc(doc(db, 'groups', code), {
        members: arrayUnion(effectiveUserId),
      });
    }

    const profileData = {
      displayName: cleanDisplayName,
      email: auth.currentUser?.email || cleanEmail,
      points: userSnap.exists() && userSnap.data().groupId === code ? userSnap.data().points : 0,
      groupId: code,
      joinedAt: serverTimestamp(),
      avatarIndex: currentMemberIds.length,
    };

    await setDoc(userDocRef, profileData, { merge: true });

    setUser({ uid: effectiveUserId, email: profileData.email });
    setGroupId(code);
    setUserProfile({ id: effectiveUserId, ...profileData });
    setActiveTab('ranking'); // Instant redirect to group tab
    addToast(`¡Te has unido al grupo ${groupData.name || code}!`, 'success');
    return code;
  };

  // Poll functions
  const createPoll = async ({ question, targetMemberId, targetMemberName, sanctionType, sanctionPoints, expiresInHours }) => {
    if (!user || !groupId) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    if (!useFirebase) {
      const newPoll = {
        id: 'poll-' + Date.now(),
        groupId,
        question,
        createdBy: user.uid,
        createdByName: userProfile?.displayName || 'Miembro',
        targetMemberId,
        targetMemberName,
        sanctionType,
        sanctionPoints: Number(sanctionPoints),
        votesFor: [],
        votesAgainst: [],
        status: 'active',
        createdAt: new Date(),
        expiresAt: expiresAt.toISOString(),
      };
      const updatedPolls = [newPoll, ...polls];
      const newActivity = {
        id: 'act-' + Date.now(),
        groupId,
        type: 'vote',
        text: `${userProfile?.displayName} ha propuesto una votación contra ${targetMemberName}: "${question}"`,
        createdAt: new Date(),
      };
      const updatedActivities = [newActivity, ...activities];
      const newNotif = {
        id: 'notif-' + Date.now(),
        text: `${userProfile?.displayName} ha creado una votación sobre ${targetMemberName}`,
        read: false,
        createdAt: new Date(),
      };
      const updatedNotifs = [newNotif, ...notifications];

      setPolls(updatedPolls);
      setActivities(updatedActivities);
      setNotifications(updatedNotifs);
      saveDemoState(null, updatedPolls, null, updatedActivities, updatedNotifs);
      addToast('Votación creada correctamente', 'success');
      return newPoll.id;
    }

    const pollRef = await addDoc(collection(db, 'polls'), {
      groupId,
      question,
      createdBy: user.uid,
      createdByName: userProfile.displayName,
      targetMemberId,
      targetMemberName,
      sanctionType,
      sanctionPoints: Number(sanctionPoints),
      votesFor: [],
      votesAgainst: [],
      status: 'active',
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    });

    await addDoc(collection(db, 'activities'), {
      groupId,
      type: 'vote',
      text: `${userProfile.displayName} ha creado una votación: "${question}"`,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'notifications'), {
      userId: targetMemberId,
      text: `${userProfile.displayName} ha propuesto una votación sobre ti: "${question}"`,
      read: false,
      createdAt: serverTimestamp(),
    });

    addToast('Votación creada correctamente', 'success');
    return pollRef.id;
  };

  const resolvePoll = async (pollId) => {
    if (!useFirebase) {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      const forVotes = poll.votesFor.length;
      const againstVotes = poll.votesAgainst.length;
      let updatedMembers = [...members];
      let newActivities = [...activities];

      if (forVotes > againstVotes) {
        const pointDelta = poll.sanctionType === 'penalty' ? poll.sanctionPoints : -poll.sanctionPoints;
        updatedMembers = updatedMembers.map(m => {
          if (m.id === poll.targetMemberId) {
            return { ...m, points: Math.max(0, m.points + pointDelta) };
          }
          return m;
        });
        updatedMembers = deduplicateMembers(updatedMembers);
        updatedMembers.sort((a, b) => b.points - a.points);
        setMembers(updatedMembers);

        newActivities = [{
          id: 'act-' + Date.now(),
          groupId,
          type: poll.sanctionType,
          text: `Votación aprobada: ${poll.targetMemberName} recibe ${poll.sanctionType === 'penalty' ? '+' : '-'}${poll.sanctionPoints} puntos.`,
          createdAt: new Date(),
        }, ...newActivities];
      } else {
        newActivities = [{
          id: 'act-' + Date.now(),
          groupId,
          type: 'vote',
          text: `La acusación contra ${poll.targetMemberName} fue rechazada por mayoría.`,
          createdAt: new Date(),
        }, ...newActivities];
      }

      const updatedPolls = polls.map(p => p.id === pollId ? { ...p, status: 'closed' } : p);
      setPolls(updatedPolls);
      setActivities(newActivities);
      saveDemoState(updatedMembers, updatedPolls, null, newActivities, null);
      addToast('Votación resuelta y puntos actualizados', 'info');
      return;
    }

    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) return;

    const pollData = pollSnap.data();
    const forVotes = pollData.votesFor.length;
    const againstVotes = pollData.votesAgainst.length;

    if (forVotes > againstVotes) {
      const targetRef = doc(db, 'users', pollData.targetMemberId);
      const pointChange = pollData.sanctionType === 'penalty' 
        ? pollData.sanctionPoints 
        : -pollData.sanctionPoints;

      await updateDoc(targetRef, {
        points: increment(pointChange),
      });

      await addDoc(collection(db, 'activities'), {
        groupId: pollData.groupId,
        type: pollData.sanctionType,
        text: `La votación "${pollData.question}" ha sido aprobada. ${pollData.targetMemberName} ${pollData.sanctionType === 'penalty' ? 'recibe' : 'pierde'} ${pollData.sanctionPoints} puntos`,
        createdAt: serverTimestamp(),
      });
    }

    await updateDoc(pollRef, { status: 'closed' });
  };

  const votePoll = async (pollId, voteType) => {
    if (!user) return;

    if (!useFirebase) {
      const currentPoll = polls.find(p => p.id === pollId);
      if (!currentPoll) return;

      if (currentPoll.votesFor.includes(user.uid) || currentPoll.votesAgainst.includes(user.uid)) {
        addToast('Ya has votado en esta encuesta', 'error');
        return;
      }

      const updatedPolls = polls.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            votesFor: voteType === 'for' ? [...p.votesFor, user.uid] : p.votesFor,
            votesAgainst: voteType === 'against' ? [...p.votesAgainst, user.uid] : p.votesAgainst,
          };
        }
        return p;
      });

      setPolls(updatedPolls);
      saveDemoState(null, updatedPolls);
      addToast('Voto registrado ✓', 'success');

      // Check auto resolution
      const updatedP = updatedPolls.find(p => p.id === pollId);
      const totalVotes = updatedP.votesFor.length + updatedP.votesAgainst.length;
      if (totalVotes >= members.length - 1) {
        setTimeout(() => resolvePoll(pollId), 800);
      }
      return;
    }

    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) return;

    const pollData = pollSnap.data();
    if (pollData.votesFor.includes(user.uid) || pollData.votesAgainst.includes(user.uid)) {
      addToast('Ya has votado en esta encuesta', 'error');
      return;
    }

    const updateData = voteType === 'for'
      ? { votesFor: arrayUnion(user.uid) }
      : { votesAgainst: arrayUnion(user.uid) };

    await updateDoc(pollRef, updateData);
    addToast('Voto registrado ✓', 'success');
  };

  const addPunishment = async ({ month, year, memberId, memberName, description }) => {
    if (!groupId) return;

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    if (!useFirebase) {
      const newPunish = {
        id: 'punish-' + Date.now(),
        groupId,
        month: monthStr,
        memberId,
        memberName,
        description,
        status: 'pending',
        createdAt: new Date(),
      };
      const updatedPunishments = [newPunish, ...punishments];
      const newAct = {
        id: 'act-' + Date.now(),
        groupId,
        type: 'punishment',
        text: `Nuevo castigo mensual acordado para ${memberName}: "${description}"`,
        createdAt: new Date(),
      };
      const updatedActs = [newAct, ...activities];

      setPunishments(updatedPunishments);
      setActivities(updatedActs);
      saveDemoState(null, null, updatedPunishments, updatedActs, null);
      addToast('Castigo mensual registrado', 'success');
      return;
    }

    await addDoc(collection(db, 'punishments'), {
      groupId,
      month: monthStr,
      memberId,
      memberName,
      description,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'activities'), {
      groupId,
      type: 'punishment',
      text: `Se ha asignado castigo a ${memberName}: "${description}"`,
      createdAt: serverTimestamp(),
    });

    addToast('Castigo registrado', 'success');
  };

  const completePunishment = async (punishmentId) => {
    if (!useFirebase) {
      const updated = punishments.map(p => p.id === punishmentId ? { ...p, status: 'completed' } : p);
      setPunishments(updated);
      saveDemoState(null, null, updated);
      addToast('¡Castigo cumplido! 👏', 'success');
      return;
    }

    await updateDoc(doc(db, 'punishments', punishmentId), {
      status: 'completed',
    });
    addToast('Castigo marcado como completado', 'success');
  };

  const markNotificationRead = async (notifId) => {
    if (!useFirebase) {
      const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
      setNotifications(updated);
      saveDemoState(null, null, null, null, updated);
      return;
    }
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  // Top scorer with highest points is the Fun Police / Aguafiestas!
  const sortedMembers = deduplicateMembers(members).sort((a, b) => b.points - a.points);
  const currentPolice = sortedMembers.length > 0 && sortedMembers[0].points > 0 ? sortedMembers[0] : (sortedMembers[0] || null);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const value = {
    user,
    userProfile,
    members: sortedMembers,
    polls,
    activities,
    punishments,
    notifications,
    loading,
    toasts,
    groupId,
    activeTab,
    setActiveTab,
    currentPolice,
    unreadNotifications,
    useFirebase,
    login,
    register,
    logout,
    createGroup,
    joinGroup,
    createPoll,
    votePoll,
    resolvePoll,
    addPunishment,
    completePunishment,
    markNotificationRead,
    addToast,
    loginAsDemoUser,
    getInitials,
    getAvatarColor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
