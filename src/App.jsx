import { Routes, Route } from "react-router-dom";
import RequireAuth from "./config/RequireAuth";

import Landing from "./pages/landingpage"; // ✅ NEW
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateRoom from "./pages/CreateRoom";
import Lobby from "./pages/Lobby";
import BattleEditor from "./pages/BattleEditor";
import MainLayout from "./layout/MainLayout";
import BattleDetails from "./pages/BattleDetails";

export default function App() {
  return (
    <Routes>
      {/* ✅ Landing opens first */}
      <Route path="/" element={<Landing />} />

      {/* ✅ Move login to /login (so Google console routes won't be affected) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/room/:roomId" element={<Lobby />} />
        <Route path="/history/:roomCode" element={<BattleDetails />} />
        <Route path="/battle/:roomId" element={<BattleEditor />} />
      </Route>
    </Routes>
  );
}