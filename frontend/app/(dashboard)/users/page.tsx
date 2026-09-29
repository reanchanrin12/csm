import React from "react";
import { UsersManagement } from "@/components/users-management";

export const metadata = {
  title: "System Users Management - CSM",
  description: "Manage system user accounts and permissions",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-800">
          User Profile & System Access
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          គ្រប់គ្រងគណនីចូលប្រើប្រព័ន្ធ និងកំណត់សិទ្ធិបុគ្គលិក (Manage all user & branch permissions)
        </p>
      </div>

      <UsersManagement />
    </div>
  );
}
