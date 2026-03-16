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

// ===================== AUTH / ROLES =====================

export async function checkIsAdmin(firestore: Firestore, uid: string, email?: string): Promise<boolean> {
    const profile = await getActiveUser(firestore, uid);
    if (profile) {
        return profile.role === 'admin';
    }
    return email === PRIMARY_ADMIN_EMAIL;
}

export async function ensurePrimaryAdmin(firestore: Firestore, uid: string, email: string): Promise<void> {
    if (email !== PRIMARY_ADMIN_EMAIL) return;

    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
        await setDoc(docRef, {
            uid,
            email: PRIMARY_ADMIN_EMAIL,
            role: 'admin',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
    }
}

// ===================== USER OPERATIONS =====================

export async function getActiveUser(firestore: Firestore, uid: string): Promise<UserProfile | null> {
    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        return {
            ...data,
            createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
            lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
        } as UserProfile;
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
            ...data
        });
    }
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
    const q = query(collection(firestore, 'users'), orderBy('email', 'asc'));
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

export async function updateUserStatus(
    firestore: Firestore,
    uid: string,
    status: UserStatus,
): Promise<void> {
    await updateDoc(doc(firestore, 'users', uid), { status });
}

export async function updateUserRole(
    firestore: Firestore,
    uid: string,
    role: UserRole,
): Promise<void> {
    await updateDoc(doc(firestore, 'users', uid), { role });
}

export async function checkProfessorBlocked(firestore: Firestore, uid: string): Promise<boolean> {
    const profile = await getActiveUser(firestore, uid);
    return profile?.status === 'blocked';
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
