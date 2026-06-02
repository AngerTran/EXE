import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./components/Home";
import ProtectedDashboard from "./components/ProtectedDashboard";
import Pricing from "./components/Pricing";
import Contact from "./components/Contact";
import Auth from "./components/Auth";
import ProtectedCheckout from "./components/ProtectedCheckout";
import AssetsMarketplace from "./components/AssetsMarketplace";
import ProtectedAssetsCheckout from "./components/ProtectedAssetsCheckout";
import ProtectedAdminDashboard from "./components/ProtectedAdminDashboard";
import ProtectedMyAssets from "./components/ProtectedMyAssets";
import ProtectedAddAsset from "./components/ProtectedAddAsset";
import ProtectedMyOrders from "./components/ProtectedMyOrders";
import ProtectedProfile from "./components/ProtectedProfile";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "pricing", Component: Pricing },
      { path: "contact", Component: Contact },
      { path: "auth", Component: Auth },
      { path: "checkout", Component: ProtectedCheckout },
      { path: "marketplace", Component: AssetsMarketplace },
      { path: "my-assets", Component: ProtectedMyAssets },
      { path: "checkout-assets", Component: ProtectedAssetsCheckout },
      { path: "admin", Component: ProtectedAdminDashboard },
      { path: "add-asset", Component: ProtectedAddAsset },
      { path: "orders", Component: ProtectedMyOrders },
      { path: "profile", Component: ProtectedProfile },
      { path: "terms", Component: Terms },
      { path: "privacy", Component: Privacy },
    ],
  },
]);