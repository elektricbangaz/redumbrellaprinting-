import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const staff = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return <>
    <div className="admin-header"><div><h1>Staff</h1><p>Accounts currently able to sign in to the operations portal.</p></div></div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Access role</th><th>Added</th></tr></thead><tbody>{staff.map((person) => <tr key={person.id}><td>{person.name}</td><td>{person.email}</td><td><span className="badge badge-blue">{person.role}</span></td><td>{person.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table>{staff.length === 0 && <div className="admin-empty">No staff accounts found.</div>}</div></div>
    <p className="admin-data-note">This is a staff directory only. Role-based permissions, invitations, and workstation assignments are not implemented yet.</p>
  </>;
}
