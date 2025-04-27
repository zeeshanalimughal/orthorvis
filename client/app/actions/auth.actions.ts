"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthService, {
  AuthResponse,
  LoginData,
  RegisterData,
} from "@/lib/services/auth.service";

/**
 * Server action to handle user login
 */
export async function loginAction(data: LoginData) {
  try {
    const response = await AuthService.login(data);
    const cookieStore = await cookies();
    cookieStore.set("auth-token", response.token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });

    return { success: true, data: response as AuthResponse };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Login failed";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to handle user registration
 */
export async function registerAction(data: RegisterData) {
  try {
    const response = await AuthService.register(data);
    const cookieStore = await cookies();
    cookieStore.set("auth-token", response.token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });

    return { success: true, data: response };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to handle user logout
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
    cookieStore.delete("token");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Logout failed";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to check authentication status
 */
export async function checkAuthAction() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  if (!authToken) {
    return { isAuthenticated: false };
  }

  try {
    const response = await AuthService.getSession(authToken.value || "");
    if (!response) {
      return { isAuthenticated: false };
    }
    return { isAuthenticated: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check authentication";
    console.error(errorMessage);
    cookieStore.delete("auth-token");
    return { isAuthenticated: false };
  }
}

export async function getToken() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");
    if (!authToken) return null;
    return authToken.value;
  } catch (e: any) {
    console.log("Error:", e);
    return null;
  }
}
