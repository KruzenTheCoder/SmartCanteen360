"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "employeeNumber", label: "Employee number", required: true, placeholder: "E-0006" },
  { name: "status", label: "Status", type: "select", defaultValue: "ACTIVE", options: [
    { label: "Active", value: "ACTIVE" },
    { label: "On leave", value: "ON_LEAVE" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Terminated", value: "TERMINATED" },
  ] },
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "mealSubsidy", label: "Meal subsidy (R)", type: "number", step: 0.01, defaultValue: 0 },
];

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Employee" description="Create an employee with a wallet, loyalty account and QR card." />
      <ResourceForm endpoint="/employees" fields={fields} redirectTo="/employees" submitLabel="Create employee" />
    </div>
  );
}
