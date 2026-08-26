import React from "react";

import Login from "../pages/LoginForm";
import Dashboard from "../pages/DashBoard";
import User from "../pages/User";
import Products from "../pages/Products";
import Receiving from "../pages/Receiving";
import Category from "../pages/Category";
import Uom from "../pages/Uom";
import Supplier from "../pages/Supplier";
import MiscellaneousReceipt from "../pages/MiscellaneousReceipt";

import Layout from "../components/Layout/Layout";
import ProtectedRoute from "./ProtectedRoutes";

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import MiscellaneousIssue from "@/pages/MiscellaneousIssue";
import MoveOrder from "@/pages/MoveOrder";
import Mrp from "@/pages/Mrp";
import Cashier from "@/pages/Cashier";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/user",
            element: <User />,
          },
          {
            path: "/products",
            element: <Products />,
          },
          {
            path: "/receiving",
            element: <Receiving />,
          },
          {
            path: "/category",
            element: <Category />,
          },
          {
            path: "/uom",
            element: <Uom />,
          },
          {
            path: "/supplier",
            element: <Supplier />,
          },
          {
            path: "/miscellaneous",
            element: <MiscellaneousReceipt />,
          },
          {
            path: "/miscellaneous_issue",
            element: <MiscellaneousIssue />,
          },
          {
            path: "/move_order",
            element: <MoveOrder />,
          },
          {
            path: "/mrp",
            element: <Mrp />,
          },
          {
            path: "/cashier",
            element: <Cashier />,
          },
        ],
      },
    ],
  },
]);

const RouterProviders = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default RouterProviders;
