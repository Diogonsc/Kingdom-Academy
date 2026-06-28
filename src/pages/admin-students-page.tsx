import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAllProfiles,
  updateProfileRole,
} from "@/services/profiles";
import type { Profile, UserRole } from "@/types/database";

const roleLabels: Record<UserRole, string> = {
  member: "Membro",
  leader: "Líder",
  admin: "Admin",
};

const roleCycle: Record<UserRole, UserRole> = {
  member: "leader",
  leader: "admin",
  admin: "member",
};

function exportProfilesCsv(profiles: Profile[]) {
  const header = "nome,email,role,data_cadastro";
  const rows = profiles.map((profile) => {
    const date = new Date(profile.created_at).toLocaleDateString("pt-BR");
    const email = profile.email ?? "";
    return `"${profile.name}","${email}","${roleLabels[profile.role]}","${date}"`;
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `membros-kingdom-academy-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminStudentsPage() {
  const { profile: currentProfile } = useAuth();
  const isReadOnly = currentProfile?.role === "leader";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  async function loadProfiles() {
    setLoading(true);

    try {
      const data = await fetchAllProfiles();
      setProfiles(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar membros",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesRole = roleFilter === "all" || profile.role === roleFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        profile.name.toLowerCase().includes(query) ||
        (profile.email ?? "").toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [profiles, roleFilter, search]);

  async function handleChangeRole(profile: Profile) {
    const nextRole = roleCycle[profile.role];

    try {
      await updateProfileRole(profile.id, nextRole);
      toast.success(`${profile.name} agora é ${roleLabels[nextRole]}`);
      await loadProfiles();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil",
      );
    }
  }

  if (loading) {
    return <Loading message="Carregando membros..." />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-sm text-muted-foreground">
            {isReadOnly
              ? "Visualize os membros da organização."
              : "Gerencie os perfis e permissões dos usuários."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportProfilesCsv(filteredProfiles)}
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />

        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="member">Membro</SelectItem>
            <SelectItem value="leader">Líder</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.name}</TableCell>
                <TableCell>{profile.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[profile.role]}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/membros/${profile.id}`}>
                        <Eye className="size-4" />
                        Analytics
                      </Link>
                    </Button>
                    {!isReadOnly ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleChangeRole(profile)}
                      >
                        Promover/Rebaixar
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
