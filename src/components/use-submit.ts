"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/server/actions";

type ActionPayload = { id?: string; warning?: string };

export function useSubmit() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(
    work: () => Promise<ActionResult<ActionPayload>>,
    onOk?: (data: ActionPayload | undefined) => void,
  ) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await work();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return result;
    }
    setWarning(result.data?.warning ?? result.warning ?? null);
    setSaved(true);
    onOk?.(result.data);
    router.refresh();
    return result;
  }

  return { error, warning, pending, saved, submit, setError };
}
