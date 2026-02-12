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
import { UserProfile, LabLog } from './types';

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

// ===================== AUTH / ROLES =====================

export async function checkIsAdmin(firestore: Firestore, uid: string): Promise<boolean> {
    const snap = await getDoc(doc(firestore, 'roles_admin', uid));
    return snap.exists();
}

// ===================== USER OPERATIONS =====================

export async function getUserProfile(firestore: Firestore, uid: string): Promise<UserProfile | null> {
    const profSnap = await getDoc(doc(firestore, 'professors', uid));
    if (profSnap.exists()) return { uid: profSnap.id, ...profSnap.data() } as UserProfile;

    const adminSnap = await getDoc(doc(firestore, 'admins', uid));
    if (adminSnap.exists()) return { uid: adminSnap.id, ...adminSnap.data() } as UserProfile;

    return null;
}

export async function createOrUpdateProfessorProfile(
    firestore: Firestore,
    uid: string,
    data: { email: string; displayName: string; photoURL?: string },
): Promise<void> {
    await setDoc(
        doc(firestore, 'professors', uid),
        {
            id: uid,
            email: data.email,
            displayName: data.displayName,
            role: 'professor',
            photoURL: data.photoURL || '',
            status: 'active',
        },
        { merge: true },
    );
}

export async function getAllProfessors(firestore: Firestore): Promise<UserProfile[]> {
    const snap = await getDocs(collection(firestore, 'professors'));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function updateUserStatus(
    firestore: Firestore,
    uid: string,
    status: 'active' | 'blocked',
): Promise<void> {
    await updateDoc(doc(firestore, 'professors', uid), { status });
}

export async function checkProfessorBlocked(firestore: Firestore, uid: string): Promise<boolean> {
    const snap = await getDoc(doc(firestore, 'professors', uid));
    if (!snap.exists()) return false;
    return snap.data().status === 'blocked';
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

    await updateDoc(ref, { checkOut: Timestamp.fromDate(now), duration });
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
