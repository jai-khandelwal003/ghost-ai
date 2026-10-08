import { auth } from "@clerk/nextjs/server";

export default async function EditorPage() {
  await auth.protect();

  return <div className="h-full w-full bg-base" />;
}
