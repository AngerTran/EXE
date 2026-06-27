import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./components/Home";
import ProtectedDashboard from "./components/ProtectedDashboard";
import Pricing from "./components/Pricing";
import Contact from "./components/Contact";
import Auth from "./components/Auth";
import AuthCallback from "./components/AuthCallback";
import ResetPassword from "./components/ResetPassword";
import ProtectedCheckout from "./components/ProtectedCheckout";
import ProtectedCreditsCheckout from "./components/ProtectedCreditsCheckout";
import AssetsMarketplace from "./components/AssetsMarketplace";
import ProtectedAssetsCheckout from "./components/ProtectedAssetsCheckout";
import ProtectedAdminDashboard from "./components/ProtectedAdminDashboard";
import ProtectedMyAssets from "./components/ProtectedMyAssets";
import ProtectedAddAsset from "./components/ProtectedAddAsset";
import ProtectedMyOrders from "./components/ProtectedMyOrders";
import ProtectedProfile from "./components/ProtectedProfile";
import ProtectedSellerDashboard from "./components/ProtectedSellerDashboard";
import ProtectedSellerUpload from "./components/ProtectedSellerUpload";
import ProtectedSellerApply from "./components/ProtectedSellerApply";
import ProtectedSellerEdit from "./components/ProtectedSellerEdit";
import CreatorStorefront from "./components/CreatorStorefront";
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
      { path: "auth/callback", Component: AuthCallback },
      { path: "auth/reset", Component: ResetPassword },
      { path: "checkout", Component: ProtectedCheckout },
      { path: "checkout-credits", Component: ProtectedCreditsCheckout },
      { path: "marketplace", Component: AssetsMarketplace },
      { path: "my-assets", Component: ProtectedMyAssets },
      { path: "checkout-assets", Component: ProtectedAssetsCheckout },
      { path: "admin", Component: ProtectedAdminDashboard },
      { path: "add-asset", Component: ProtectedAddAsset },
      { path: "seller", Component: ProtectedSellerDashboard },
      { path: "seller/upload", Component: ProtectedSellerUpload },
      { path: "seller/edit/:id", Component: ProtectedSellerEdit },
      { path: "seller/apply", Component: ProtectedSellerApply },
      { path: "creator/:username", Component: CreatorStorefront },
      { path: "orders", Component: ProtectedMyOrders },
      { path: "profile", Component: ProtectedProfile },
      { path: "terms", Component: Terms },
      { path: "privacy", Component: Privacy },
    ],
  },
]);