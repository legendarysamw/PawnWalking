import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import type { Role } from "@pawnwalking/shared";
import LoginScreen from "./src/screens/LoginScreen";
import OwnerScreen from "./src/screens/OwnerScreen";
import WalkerScreen from "./src/screens/WalkerScreen";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <>
      <StatusBar style="dark" />
      {role === "OWNER" && <OwnerScreen />}
      {role === "WALKER" && <WalkerScreen />}
      {role === null && <LoginScreen onLoggedIn={setRole} />}
    </>
  );
}
