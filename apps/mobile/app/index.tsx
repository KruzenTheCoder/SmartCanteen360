import { Redirect } from "expo-router";

/** Entry point: the root layout's guard handles auth; default into the tabs. */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
