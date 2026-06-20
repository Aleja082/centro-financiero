import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PortfolioProvider } from './context/PortfolioContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Assets from './pages/Assets'
import Recommendations from './pages/Recommendations'
import Alerts from './pages/Alerts'
import Checklist from './pages/Checklist'
import Contributions from './pages/Contributions'
import Simulator from './pages/Simulator'
import Opportunities from './pages/Opportunities'
import DataManager from './pages/DataManager'

export default function App() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analisis" element={<Analysis />} />
              <Route path="/activos" element={<Assets />} />
              <Route path="/recomendaciones" element={<Recommendations />} />
              <Route path="/alertas" element={<Alerts />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/aportes" element={<Contributions />} />
              <Route path="/simulador" element={<Simulator />} />
              <Route path="/oportunidades" element={<Opportunities />} />
              <Route path="/datos" element={<DataManager />} />
            </Route>
          </Routes>
        </HashRouter>
      </PortfolioProvider>
    </ThemeProvider>
  )
}
