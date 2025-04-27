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
    cookieStore.set("token", response?.token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
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
    cookieStore.set("token", response?.token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
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
    await AuthService.logout();

    const cookieStore = await cookies();
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
  const authToken = cookieStore.get("token");

  if (!authToken) {
    return { isAuthenticated: false };
  }

  try {
    await AuthService.getCurrentUser();
    return { isAuthenticated: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check authentication";

    console.error(errorMessage);
    cookieStore.delete("token");
    return { isAuthenticated: false };
  }
}
