import api from "../config/axios";

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  message: string;
}

export interface ErrorResponse {
  message: string;
  statusCode?: number;
}

const AuthService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Registration failed";
      throw new Error(errorMessage);
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Login failed";
      throw new Error(errorMessage);
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await api.get<{ message: string }>("/auth/logout");
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Logout failed";
      throw new Error(errorMessage);
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (token?: string): Promise<AuthResponse> => {
    try {
      const headers: any = {};
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
      const response = await api.get("/auth/me", {
        headers,
      });
      console.log("Raw response from /auth/me:", response.data);

      const responseData = response.data;

      if (responseData.data && !responseData.user) {
        return {
          user: {
            id: responseData.data._id || responseData.data.id,
            fullName: responseData.data.fullName,
            email: responseData.data.email,
          },
          message:
            responseData.message || "User profile retrieved successfully",
        };
      }

      return responseData;
    } catch (error: any) {
      console.error("Error in getCurrentUser:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to get user profile";
      throw new Error(errorMessage);
    }
  },
};

export default AuthService;
