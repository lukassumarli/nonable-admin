import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from './layouts/dashboard';
import LogoOnlyLayout from './layouts/LogoOnlyLayout';
//
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardApp from './pages/DashboardApp';
import Products from './pages/Products';
import Blog from './pages/Blog';
import User from './pages/User';
import Customers from './pages/Customers';
import NotFound from './pages/Page404';
import AddEditCustomers from './pages/AddEditCustomers';
import AddEditUsers from './pages/AddEditUsers';
import AddEditDrivers from './pages/AddEditDrivers';
import Driver from './pages/Driver';
import Client from './pages/Client';
import AddEditClients from './pages/AddEditClients';
import Job from './pages/Job';
import AddEditJobs from './pages/AddEditJobs';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { path: '/', element: <Navigate to="/dashboard/app" replace /> },
        { path: 'app', element: <DashboardApp /> },
        { path: 'user', element: <User /> },
        { path: 'driver', element: <Driver /> },
        { path: 'customer', element: <Customers /> },
        { path: 'client', element: <Client /> },
        { path: 'booking', element: <Job /> },
        { path: 'customer-manage', element: <AddEditCustomers /> },
        { path: 'user-manage', element: <AddEditUsers /> },
        { path: 'driver-manage', element: <AddEditDrivers /> },
        { path: 'client-manage', element: <AddEditClients /> },
        { path: 'booking-manage', element: <AddEditJobs /> },
        { path: 'products', element: <Products /> },
        { path: 'blog', element: <Blog /> }
      ]
    },
    {
      path: '/',
      element: <LogoOnlyLayout />,
      children: [
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: '404', element: <NotFound /> },
        { path: '/', element: <Navigate to="/dashboard" /> },
        { path: '*', element: <Navigate to="/404" /> }
      ]
    },

    { path: '*', element: <Navigate to="/404" replace /> }
  ]);
}