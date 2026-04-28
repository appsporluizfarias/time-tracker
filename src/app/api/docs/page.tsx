"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Apexio Timer — API Reference
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Authenticate with a Bearer token from Settings → API Tokens.
        </p>
      </div>
      <SwaggerUI url="/api/docs/openapi.json" />
    </div>
  );
}
