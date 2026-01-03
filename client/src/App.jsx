import { BrowserRouter, Routes, Route } from "react-router-dom";
import CarMastersHero from "./components/CarMastersHero";
import PrioridadSelector from "./components/PrioridadSelector";
import VehicleSelector from "./components/VehicleSelector";
import Recomendacion from "./components/Recomendacion";

import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
      <Routes>
        <Route path="/" element={<CarMastersHero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/configurador" element={<PrioridadSelector />} />
        <Route path="/configurador/vehiculo" element={<VehicleSelector />} />
        <Route path="/configurador/recomendacion" element={<Recomendacion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
