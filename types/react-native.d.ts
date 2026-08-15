declare module "react-native" {
  export const Platform: { OS: "web" | "ios" | "android"; select<T>(options: Record<string, T>): T };
  export const AppState: {
    addEventListener(event: string, handler: (state: string) => void): { remove(): void };
    currentState: string | null;
  };
  export const Linking: {
    openURL(url: string): Promise<void>;
  };
  export const StyleSheet: { create<T extends Record<string, unknown>>(styles: T): T };
  export const View: any;
  export const Text: any;
  export const Pressable: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const Modal: any;
  export const SafeAreaView: any;
  export const ActivityIndicator: any;
  export const Switch: any;
}
