import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PrivyProvider } from '@privy-io/react-auth';
import { LandingPage } from "./pages/landingPage";
import { MarketPage } from "./pages/marketPage";
import { privyConfig } from "./lib/privy";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <PrivyProvider
      appId="cmg2zykcf00jnla0ct3vw8mc9"
      config={privyConfig}
    >
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/markets" element={<MarketPage />} />
        </Routes>
      </Router>
    </PrivyProvider>
  </StrictMode>,
);
