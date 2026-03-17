import {
    Firestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
    setDoc,
    deleteDoc,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { UserProfile, UserRole, UserStatus, LabLog } from './types';

// ===================== HELPERS =====================

function toDate(ts: unknown): Date {
    if (ts instanceof Timestamp) return ts.toDate();
    if (ts instanceof Date) return ts;
    return new Date();
}

function logFromDoc(docSnap: QueryDocumentSnapshot<DocumentData>): LabLog {
    const d = docSnap.data();
    return {
        id: docSnap.id,
        professorId: d.professorId,
        professorName: d.professorName,
        roomNumber: d.roomNumber,
        checkIn: toDate(d.checkIn),
        checkOut: d.checkOut ? toDate(d.checkOut) : undefined,
        duration: d.duration ?? undefined,
    };
}

const PRIMARY_ADMIN_EMAIL = 'jcesperanza@neu.edu.ph';

function mapLegacyUser(
    uid: string,
    data: DocumentData,
    role: UserRole,
): UserProfile {
    const email = data.email || data.institutionalEmail || '';
    const displayName = data.displayName || data.fullName || email || 'User';
    const status: UserStatus = data.status || (data.isBlocked ? 'blocked' : 'active');

    return {
        uid,
        email,
        displayName,
        role,
        status,
        photoURL: data.photoURL || undefined,
        createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
        lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
    };
}

// ===================== AUTH / ROLES =====================

export async function checkIsAdmin(firestore: Firestore, uid: string, email?: string): Promise<boolean> {
    const profile = await getActiveUser(firestore, uid);
    if (profile) {
        return profile.role === 'admin';
    }

    const legacyRole = await getDoc(doc(firestore, 'roles_admin', uid));
    if (legacyRole.exists()) {
        return true;
    }

    return email === PRIMARY_ADMIN_EMAIL;
}

export async function ensurePrimaryAdmin(firestore: Firestore, uid: string, email: string): Promise<void> {
    if (email !== PRIMARY_ADMIN_EMAIL) return;

    await Promise.all([
        setDoc(doc(firestore, 'users', uid), {
            uid,
            email: PRIMARY_ADMIN_EMAIL,
            role: 'admin',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(firestore, 'admins', uid), {
            id: uid,
            institutionalEmail: PRIMARY_ADMIN_EMAIL,
            email: PRIMARY_ADMIN_EMAIL,
            role: 'admin',
            status: 'active',
            lastLogin: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(firestore, 'roles_admin', uid), {
            active: true,
            email: PRIMARY_ADMIN_EMAIL,
            updatedAt: serverTimestamp(),
        }, { merge: true }),
    ]);
}

// ===================== USER OPERATIONS =====================

export async function getActiveUser(firestore: Firestore, uid: string): Promise<UserProfile | null> {
    const userSnap = await getDoc(doc(firestore, 'users', uid));
    if (userSnap.exists()) {
        const data = userSnap.data();
        return {
            ...data,
            createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
            lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
        } as UserProfile;
    }

    const [adminSnap, professorSnap, adminRoleSnap] = await Promise.all([
        getDoc(doc(firestore, 'admins', uid)),
        getDoc(doc(firestore, 'professors', uid)),
        getDoc(doc(firestore, 'roles_admin', uid)),
    ]);

    if (adminSnap.exists() || adminRoleSnap.exists()) {
        const d = adminSnap.exists() ? adminSnap.data() : {};
        return mapLegacyUser(uid, d, 'admin');
    }

    if (professorSnap.exists()) {
        return mapLegacyUser(uid, professorSnap.data(), 'professor');
    }

    return null;
}

// Keeping for compatibility with AuthGuard if needed, but pointing to users
export async function getUserProfile(firestore: Firestore, uid: string): Promise<UserProfile | null> {
    return getActiveUser(firestore, uid);
}

export async function createOrUpdateProfessorProfile(
    firestore: Firestore,
    uid: string,
    data: { email: string; displayName: string; photoURL?: string },
): Promise<void> {
    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        await setDoc(docRef, {
            uid,
            email: data.email,
            displayName: data.displayName,
            role: 'professor',
            photoURL: data.photoURL || '',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        });
    } else {
        await updateDoc(docRef, {
            lastLogin: serverTimestamp(),
            ...data,
        });
    }

    // Legacy compatibility: keep old professor profile in sync.
    await setDoc(doc(firestore, 'professors', uid), {
        id: uid,
        institutionalEmail: data.email,
        fullName: data.displayName,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || '',
        isBlocked: false,
        lastLogin: serverTimestamp(),
    }, { merge: true });
}

export async function getAllProfessors(firestore: Firestore): Promise<UserProfile[]> {
    const q = query(collection(firestore, 'users'), where('role', '==', 'professor'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return { 
            uid: d.id, 
            ...data,
            createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
            lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
        } as UserProfile;
    });
}

export async function getAllUsers(firestore: Firestore): Promise<UserProfile[]> {
    const [usersSnap, professorsSnap, adminsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'users'), orderBy('email', 'asc'))),
        getDocs(collection(firestore, 'professors')),
        getDocs(collection(firestore, 'admins')),
    ]);

    const merged = new Map<string, UserProfile>();

    usersSnap.docs.forEach((d) => {
        const data = d.data();
        merged.set(d.id, {
            uid: d.id,
            ...data,
            createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
            lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
        } as UserProfile);
    });

    professorsSnap.docs.forEach((d) => {
        if (!merged.has(d.id)) {
            merged.set(d.id, mapLegacyUser(d.id, d.data(), 'professor'));
        }
    });

    adminsSnap.docs.forEach((d) => {
        if (!merged.has(d.id)) {
            merged.set(d.id, mapLegacyUser(d.id, d.data(), 'admin'));
        }
    });

    return Array.from(merged.values()).sort((a, b) => a.email.localeCompare(b.email));
}

export async function updateUserStatus(
    firestore: Firestore,
    uid: string,
    status: UserStatus,
): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        await setDoc(userRef, { status }, { merge: true });
    } else {
        const legacy = await getActiveUser(firestore, uid);
        if (legacy?.email) {
            await setDoc(userRef, {
                uid,
                email: legacy.email,
                displayName: legacy.displayName,
                photoURL: legacy.photoURL || '',
                role: legacy.role,
                status,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            }, { merge: true });
        }
    }

    await setDoc(doc(firestore, 'professors', uid), { isBlocked: status === 'blocked' }, { merge: true });
}

export async function updateUserRole(
    firestore: Firestore,
    uid: string,
    role: UserRole,
    identity?: { email?: string; displayName?: string; photoURL?: string },
): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        await setDoc(userRef, { role }, { merge: true });
    } else {
        const legacy = await getActiveUser(firestore, uid);
        const resolvedEmail = identity?.email || legacy?.email;

        if (!resolvedEmail) {
            throw new Error('Cannot switch role for this account yet. Missing email profile in legacy records.');
        }

        await setDoc(userRef, {
            uid,
            email: resolvedEmail,
            displayName: identity?.displayName || legacy?.displayName || resolvedEmail,
            photoURL: identity?.photoURL || legacy?.photoURL || '',
            role,
            status: legacy?.status || 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        }, { merge: true });
    }

    if (role === 'admin') {
        await setDoc(doc(firestore, 'roles_admin', uid), {
            active: true,
            email: identity?.email || null,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } else {
        await deleteDoc(doc(firestore, 'roles_admin', uid)).catch(() => {
            // Ignore not-found/no-op behavior.
        });
    }
}

export async function checkProfessorBlocked(firestore: Firestore, uid: string): Promise<boolean> {
    const profile = await getActiveUser(firestore, uid);
    if (profile) {
        return profile.status === 'blocked';
    }

    const legacy = await getDoc(doc(firestore, 'professors', uid));
    if (!legacy.exists()) return false;
    return !!legacy.data().isBlocked;
}

// ===================== LOG OPERATIONS =====================

export async function createUsageLog(
    firestore: Firestore,
    data: { professorId: string; professorName: string; roomNumber: string },
): Promise<string> {
    const ref = await addDoc(collection(firestore, 'usage_logs'), {
        professorId: data.professorId,
        professorName: data.professorName,
        roomNumber: data.roomNumber,
        checkIn: serverTimestamp(),
        checkOut: null,
        duration: null,
    });
    return ref.id;
}

export async function checkOutLog(firestore: Firestore, logId: string): Promise<void> {
    const ref = doc(firestore, 'usage_logs', logId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Log not found');

    const checkIn = toDate(snap.data().checkIn);
    const now = new Date();
    const duration = Math.round((now.getTime() - checkIn.getTime()) / 60000);

    await updateDoc(ref, { checkOut: serverTimestamp(), duration });
}

export async function getActiveSession(firestore: Firestore, professorId: string): Promise<LabLog | null> {
    const q = query(collection(firestore, 'usage_logs'), where('professorId', '==', professorId));
    const snap = await getDocs(q);
    const active = snap.docs.find((d) => {
        const data = d.data();
        return data.checkOut === null || data.checkOut === undefined;
    });
    return active ? logFromDoc(active) : null;
}

export async function getAllLogs(firestore: Firestore): Promise<LabLog[]> {
    const q = query(collection(firestore, 'usage_logs'), orderBy('checkIn', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(logFromDoc);
}

export async function getLogsByProfessor(firestore: Firestore, professorId: string): Promise<LabLog[]> {
    const q = query(collection(firestore, 'usage_logs'), where('professorId', '==', professorId));
    const snap = await getDocs(q);
    return snap.docs.map(logFromDoc).sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
}
