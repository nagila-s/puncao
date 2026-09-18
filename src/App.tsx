import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import { BrailleEditor } from "./pages/BrailleEditor";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import AuthCallback from "./pages/AuthCallback";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import MeusDesenhos from "./pages/MeusDesenhos";
import Publicados from "./pages/Publicados";
import Admin from "./pages/Admin";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BrailleEditor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          <Route path="/app" element={<BrailleEditor />} />
          <Route
            path="/meus-desenhos"
            element={
              <ProtectedRoute>
                <MeusDesenhos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publicados"
            element={
              <ProtectedRoute>
                <Publicados />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
