import type { Metadata } from "next";
import "./admin.css";
import "./admin-readability.css";
import "./admin-job-queue.css";
import "./factory-admin.css";

export const metadata: Metadata = { title: "Admin — Red Umbrella Printing" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
