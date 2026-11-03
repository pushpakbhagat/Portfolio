"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Keeps the admin shell usable when one page fails, with the reason and a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </div>
      <p className="font-medium">This page couldn&apos;t load</p>
      <p className="mt-1 mb-6 max-w-md text-sm text-muted-foreground">
        {error.message && !error.digest ? error.message : "Something went wrong on the server. Check the terminal running npm run dev for details."}
      </p>
      <Button onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </div>
  );
}
