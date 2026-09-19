export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: Priority;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
