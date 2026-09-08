import { prisma } from "@/lib/prisma";
import { BroadcastComposer } from "./BroadcastComposer";

export default async function AdminBroadcastsPage() {
  const [subscriberCount, broadcasts] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Broadcasts</h1>
          <p>Send announcements and offers to your newsletter subscribers via Resend.</p>
        </div>
      </div>
      <div className="admin-grid-2">
        <div className="admin-card">
          <BroadcastComposer subscriberCount={subscriberCount} />
        </div>
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>History</h3>
          {broadcasts.length === 0 ? (
            <div className="admin-empty">No broadcasts sent yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Sent To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td>{b.subject}</td>
                    <td>{b.sentCount}</td>
                    <td>{(b.sentAt ?? b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
