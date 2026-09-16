export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
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
