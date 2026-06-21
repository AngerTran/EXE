  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";
  import { redirectAuthHashIfNeeded } from "./utils/authHashRedirect";

  redirectAuthHashIfNeeded();

  createRoot(document.getElementById("root")!).render(<App />);
  