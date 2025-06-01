import { useEffect, useState } from "react";

interface UserAdminData {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export default function UserAdmin() {
  const [users, setUsers] = useState<UserAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then((data: { users: UserAdminData[] }) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch(err => {
        setError("Erro ao buscar usuários");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Usuários cadastrados</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Senha</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Username</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Nome de Exibição</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{u.email}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{u.password}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{u.username}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{u.displayName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 