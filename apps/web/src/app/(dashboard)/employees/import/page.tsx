"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

interface Row {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mealSubsidy?: string;
}

const HEADER_MAP: Record<string, keyof Row> = {
  employeenumber: "employeeNumber",
  "employee number": "employeeNumber",
  empno: "employeeNumber",
  firstname: "firstName",
  "first name": "firstName",
  lastname: "lastName",
  "last name": "lastName",
  surname: "lastName",
  email: "email",
  phone: "phone",
  mealsubsidy: "mealSubsidy",
  "meal subsidy": "mealSubsidy",
  subsidy: "mealSubsidy",
};

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]!).map((h) => HEADER_MAP[h.trim().toLowerCase()] ?? null);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (key) row[key] = (cells[i] ?? "").trim();
    });
    return row as unknown as Row;
  });
}

export default function ImportEmployeesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text).filter((r) => r.employeeNumber && r.firstName && r.lastName);
    setRows(parsed);
    if (parsed.length === 0) toast.error("No valid rows found", { description: "Need columns: employeeNumber, firstName, lastName." });
  };

  const submit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ created: number }>("/employees/import", { rows });
      toast.success(`Imported ${res.created} employees`);
      router.push("/employees");
      router.refresh();
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Import Employees" description="Upload a CSV to bulk-create employees (with wallet, loyalty and QR)." />

      <Card>
        <CardContent className="space-y-4 p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center hover:bg-muted/50">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName || "Choose a CSV file"}</span>
            <span className="text-xs text-muted-foreground">
              Columns: employeeNumber, firstName, lastName, email, phone, mealSubsidy
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>

          {rows.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">{rows.length} valid rows ready to import.</p>
              <div className="max-h-80 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emp #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subsidy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 50).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.employeeNumber}</TableCell>
                        <TableCell>{r.firstName} {r.lastName}</TableCell>
                        <TableCell>{r.email || "—"}</TableCell>
                        <TableCell>{r.mealSubsidy || "0"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="mr-2 h-4 w-4" /> Import {rows.length}</>}
                </Button>
                <Button variant="outline" onClick={() => { setRows([]); setFileName(""); }}>Clear</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
