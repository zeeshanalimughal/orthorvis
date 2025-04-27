"use server";

import { cookies } from "next/headers";
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
    await AuthService.getCurrentUser(authToken.value);
    return { isAuthenticated: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check authentication";

    console.error(errorMessage);
    return { isAuthenticated: false };
  }
}
