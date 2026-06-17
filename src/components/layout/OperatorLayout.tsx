import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export default function OperatorLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
}