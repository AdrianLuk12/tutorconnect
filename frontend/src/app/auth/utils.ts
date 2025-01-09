import wretch from "wretch";
import Cookies from "js-cookie";

const api = wretch("http://localhost:8000").accept("application/json");

/**
 * Stores a token in cookies.
 * @param {string} token - The token to be stored.
 * @returns {"access" | "refresh"} type - The type of token to retrieve (access or refresh).
 */
const storeToken = (token: string, type: "access" | "refresh") => {
    Cookies.set(type + "Token", token);
}

/**
 * Retrieves a token from cookies.
 * @param {"access" | "refresh"} type - The type of token to retrieve (access or refresh).
 * @returns {string | undefined} The token, if found.
 */
export const getToken = (type: string) => {
    return Cookies.get(type + "Token");
}

/**
 * Removes both access and refresh tokens from cookies. 
 */
const removeTokens = () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
}

const register = (
    email: string, 
    username: string, 
    password: string, 
    re_password: string,
    first_name?: string,
    last_name?: string
) => {
    return api.post({ 
        email, 
        username, 
        password, 
        re_password,
        first_name,
        last_name
    }, "/auth/users/");
}

const login = (email: string, password: string) => {
    return api.post({ email, password }, "/auth/jwt/create");
};

const logout = () => {
    const refreshToken = getToken("refresh");
    return api.post({ refresh: refreshToken }, "/auth/logout/");
};

const handleJWTRefresh = () => {
    const refreshToken = getToken("refresh");
    return api.post({ refresh: refreshToken }, "/auth/jwt/refresh");
};

const resetPassword = (email: string) => {
    return api.post({ email }, "/auth/users/reset_password/");
};

const resetPasswordConfirm = (
    new_password: string,
    re_new_password: string,
    token: string,
    uid: string
) => {
    return api.post(
        { uid, token, new_password, re_new_password },
        "/auth/users/reset_password_confirm/"
    );
};

export const AuthActions = () => {
    const isAuthenticated = () => {
        if (typeof window !== 'undefined') {
            const token = Cookies.get('accessToken');
            return !!token;
        }
        return false;
    };

    const autoLoginAfterRegister = async (email: string, password: string) => {
        try {
            const response = await (await login(email.toLowerCase(), password)).json();
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response format');
            }
            const { access, refresh } = response as { access: string; refresh: string };
            storeToken(access, "access");
            storeToken(refresh, "refresh");
            return true;
        } catch (error) {
            console.error("Auto login failed:", error);
            return false;
        }
    };

    return {
        login,
        resetPasswordConfirm,
        handleJWTRefresh,
        register,
        resetPassword,
        storeToken,
        getToken,
        logout,
        removeTokens,
        isAuthenticated,
        autoLoginAfterRegister,
    };
};  