import { Auth, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    hd: 'neu.edu.ph',
    prompt: 'select_account'
});

export async function signInWithGoogle(auth: Auth, loginHint?: string): Promise<void> {
    if (loginHint) {
        googleProvider.setCustomParameters({
            hd: 'neu.edu.ph',
            login_hint: loginHint,
            prompt: 'select_account'
        });
    }

    await signInWithRedirect(auth, googleProvider);
}

export async function signOutUser(auth: Auth): Promise<void> {
    await signOut(auth);
}
