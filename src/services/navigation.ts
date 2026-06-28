import { BadgeCheckIcon, BookOpenIcon, ClipboardListIcon, FileQuestionIcon, Heart, House, ImageIcon, UsersIcon } from "lucide-react";

export const navMain = [
  {
    name: "Página Inicial",
    url: "/dashboard",
    icon: House,
  },
  {
    name: "Meus Cursos",
    url: "/meus-cursos",
    icon: Heart,
    activePaths: ["/curso"],
  },
  {
    name: "Provas",
    url: "/provas",
    icon: FileQuestionIcon,
  },
  {
    name: "Livraria",
    url: "/livraria",
    icon: BookOpenIcon,
  },
  {
    name: "Meus Certificados",
    url: "/meus-certificados",
    icon: BadgeCheckIcon,
  },
] as const;

export const navAdmin = [
  {
    name: "Dashboard Admin",
    url: "/admin/dashboard",
    icon: House,
  },
  {
    name: "Cursos Admin",
    url: "/admin/cursos",
    icon: BookOpenIcon,
  },
  {
    name: "Provas",
    url: "/admin/provas",
    icon: FileQuestionIcon,
  },
  {
    name: "Matrículas",
    url: "/admin/matriculas",
    icon: ClipboardListIcon,
  },
  {
    name: "Membros",
    url: "/admin/membros",
    icon: UsersIcon,
  },
  {
    name: "Banners",
    url: "/admin/banners",
    icon: ImageIcon,
  },
] as const;

export const navLeader = [
  {
    name: "Membros",
    url: "/admin/membros",
    icon: UsersIcon,
  },
] as const;
