export type Result<T> = AppError | T;

export interface AppError {
  error: string;
}
