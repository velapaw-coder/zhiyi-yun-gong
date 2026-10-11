import { redirect } from "next/navigation";
import { AppError } from "@/server/errors";

/**
 * forbidden() / notFound() set the status code, but in this Next.js version the
 * matching boundary does not paint inside the console shell, so the main area
 * stays blank. Send the user to a normal page that renders the same copy.
 */
export async function expose<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "NOT_FOUND") redirect("/missing");
      if (error.code === "FORBIDDEN") redirect("/access-denied");
    }
    throw error;
  }
}
