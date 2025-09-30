// app/dashboard/layout.js
export const metadata = {
  title: 'Dashboard - RideShare',
  description: 'RideShare Dashboard',
};

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}
