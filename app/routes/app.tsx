import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home"> Home </Link>
            {/* 
        <Link to="/app/create-banner">Create New Banner</Link>
        <Link to="/app/manage-banners">Manage Banners</Link>
        <Link to="/app/banner-analytics">Banner Analytics</Link>
        <Link to="/app/create-bottom-banner">Create Bottom Banner</Link>
        <Link to="/app/manage-bottom-banners">Manage Bottom Banners</Link>
        <Link to="/app/create-static-banner">Create Static Banner</Link>
        <Link to="/app/manage-static-banners">Manage Static Banners</Link>
        */}

        <Link to="/app/manage-product-banners">Product Banner Settings</Link>
        <Link to="/app/banner-templates">Banner Templates</Link>
        <Link to="/app/product-banner-analytics">Product Banner Analytics</Link>
        <Link to="/app/ab-tests">A/B Testing</Link>
        <Link to="/app/sync-products">Sync Products</Link>

      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
