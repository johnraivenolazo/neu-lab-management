import { Auth, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';

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
        await signInWithRedirect(auth, googleProvider);
        return;
    } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/unauthorized-domain') {
            throw new Error('This domain is not authorized in Firebase Auth settings.');
        }
        throw err;
    }
}

export async function signOutUser(auth: Auth): Promise<void> {
    await signOut(auth);
}
