import { createBrowserRouter } from "react-router";
import { SchedulePage } from "@/pages/SchedulePage";
import { LoginPage } from "@/pages/LoginPage";
import { EditorPage } from "@/pages/EditorPage";
import { RequireEditor } from "@/components/RequireEditor";

export const router = createBrowserRouter([
  { path: "/", element: <SchedulePage /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireEditor />,
    children: [{ path: "/editor", element: <EditorPage /> }],
  },
]);
