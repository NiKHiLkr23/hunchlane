import { HeaderNavigation } from "./header-navigation";
export function Header() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <HeaderNavigation authConfigured={configured}/>;
}
