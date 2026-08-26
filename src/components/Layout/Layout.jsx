// Layout.jsx

import { Outlet } from "react-router-dom";
import SideBar from "./sideBar";
import AppBar from "./appBar";

function Layout() {
  return (
    <div className="flex h-screen w-full  bg-stone-100">
      {/* Sidebar */}

      <SideBar />

      {/* Main column: app bar on top, routed page content below */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
