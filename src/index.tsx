import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPage } from "./pages/landingPage";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
