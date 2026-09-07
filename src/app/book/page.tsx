"use client";

import { Suspense } from "react";
import BookForm from "./book-form";

export default function BookPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-14 text-sm text-muted-foreground">Loading booking form...</div>}>
      <BookForm />
    </Suspense>
  );
}
