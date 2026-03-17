import { Auth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    hd: 'neu.edu.ph',
    prompt: 'select_account'
});

export async function signInWithGoogle(auth: Auth, loginHint?: string): Promise<void> {
    googleProvider.setCustomParameters({
        hd: 'neu.edu.ph',
        prompt: 'select_account',
        ...(loginHint ? { login_hint: loginHint } : {}),
    });

    try {
        await signInWithPopup(auth, googleProvider);
        return;
    } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/popup-blocked') {
            throw new Error('Popup was blocked. Please allow popups for this site and try again.');
        }
        if (code === 'auth/unauthorized-domain') {
            throw new Error('This domain is not authorized in Firebase Auth settings.');
        }
        throw err;
    }
}

export async function signOutUser(auth: Auth): Promise<void> {
    await signOut(auth);
}
