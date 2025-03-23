import { getSession } from "./cookies";


export async function getUserId() {
        const session = await getSession();
        if (session && session.id) {
            return session.id;
        }
}

export async function loggedIn() {
    const session = await getSession();
    return session != null;
}