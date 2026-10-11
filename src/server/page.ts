import { forbidden, notFound } from "next/navigation";
import { AppError } from "@/server/errors";

export async function expose<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "NOT_FOUND") notFound();
      if (error.code === "FORBIDDEN") forbidden();
    }
    throw error;
  }
}
