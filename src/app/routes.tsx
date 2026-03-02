import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import GameModeSelection from "./pages/GameModeSelection";
import SingleplayerScreen from "./pages/SingleplayerScreen";
import MultiplayerLobby from "./pages/MultiplayerLobby";
import MultiplayerRace from "./pages/MultiplayerRace";
import HardcoreMode from "./pages/HardcoreMode";
import ProfileDashboard from "./pages/ProfileDashboard";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/modes",
    Component: GameModeSelection,
  },
  {
    path: "/singleplayer",
    Component: SingleplayerScreen,
  },
  {
    path: "/multiplayer",
    Component: MultiplayerLobby,
  },
  {
    path: "/multiplayer/race/:lobbyId",
    Component: MultiplayerRace,
  },
  {
    path: "/hardcore",
    Component: HardcoreMode,
  },
  {
    path: "/profile",
    Component: ProfileDashboard,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
]);
