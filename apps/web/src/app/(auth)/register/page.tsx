import Link from "next/link";
import { ArrowLeft, Building2, Utensils } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <h1 className="gradient-text text-2xl font-bold">NetBite360</h1>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5" /> Accounts are invite-only
            </CardTitle>
            <CardDescription>
              NetBite360 is provisioned for your organisation. Ask your company
              administrator to invite you, or contact your platform provider to onboard a
              new company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-indigo-600 hover:text-indigo-500">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
