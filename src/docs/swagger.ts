import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { env } from "../config/env";

const serverUrl =
  env.APP_URL && /^https?:\/\//.test(env.APP_URL)
    ? env.APP_URL
    : "http://localhost:8080";

const definition = {
  openapi: "3.0.0",
  info: {
    title: "Item Builder API",
    version: "1.0.0",
    description: "Backend APIs for Item / Product Builder Platform",
  },
  servers: [{ url: serverUrl }],
  tags: [
    { name: "System", description: "Health & system info" },
    { name: "Auth", description: "Authentication APIs" },
    { name: "Admin", description: "Admin & staff management (protected)" },
    { name: "Categories", description: "Category management" },
    { name: "Subcategories", description: "Subcategory management" },
    { name: "Products", description: "Product management" },
    {
      name: "Upload",
      description: "Image upload (Cloudinary) - admin/staff only",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options: swaggerJSDoc.OAS3Options = {
  definition,
  apis: ["src/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupDocs(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
}
