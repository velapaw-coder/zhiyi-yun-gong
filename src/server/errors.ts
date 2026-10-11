export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "BAD_REQUEST" | "FORBIDDEN" | "NOT_FOUND" = "BAD_REQUEST",
  ) {
    super(message);
  }
}

export function isZodIssueError(error: unknown): error is { issues: { message: string }[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  );
}
