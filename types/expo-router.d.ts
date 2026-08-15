declare module "expo-router" {
  export const Stack: any;
  export const Tabs: any;
  export const router: {
    replace(path: string): void;
    push(path: string): void;
  };
  export function useRouter(): typeof router;
  export function useRootNavigationState(): { key?: string } | null;
  export function Redirect(props: { href: string }): any;
}
