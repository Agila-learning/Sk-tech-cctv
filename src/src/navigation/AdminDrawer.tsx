import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LayoutDashboard, Clock, ShoppingBag, Users, Package, ClipboardList, Activity, Calendar, Hammer, UserCheck, IndianRupee, CreditCard, Layers, Map, Star, BarChart2, LogOut, Folder, UserPlus } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import AdminDashScreen from '../screens/admin/DashboardScreen';
import AdminExpensesScreen from '../screens/admin/AdminExpensesScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import TechniciansScreen from '../screens/admin/TechniciansScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminTasksScreen from '../screens/admin/TasksScreen';
import AdminAttendanceScreen from '../screens/admin/AttendanceScreen';
import LeavesScreen from '../screens/admin/LeavesScreen';
import ServiceRequestsScreen from '../screens/admin/ServiceRequestsScreen';
import AvailabilityScreen from '../screens/admin/AvailabilityScreen';
import BillingScreen from '../screens/admin/BillingScreen';
import SalaryScreen from '../screens/admin/SalaryScreen';
import MarketingScreen from '../screens/admin/MarketingScreen';
import TrackingScreen from '../screens/admin/TrackingScreen';
import ReviewsScreen from '../screens/admin/ReviewsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import CustomersScreen from '../screens/admin/CustomersScreen';
import CategoriesScreen from '../screens/admin/CategoriesScreen';

const Drawer = createDrawerNavigator();

const LogoutComponent = () => null;

export default function AdminDrawer() {
  const { logout } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.fgPrimary,
        headerTitleStyle: { fontWeight: '900' },
        drawerStyle: { backgroundColor: Colors.bgSurface, width: 280 },
        drawerActiveBackgroundColor: Colors.primaryFaint,
        drawerActiveTintColor: Colors.primaryLight,
        drawerInactiveTintColor: Colors.fgMuted,
        drawerLabelStyle: { fontSize: 14, fontWeight: '800' },
      }}
    >
      <Drawer.Screen name="Dashboard" component={AdminDashScreen} options={{ drawerIcon: ({ color }) => <LayoutDashboard color={color} size={20} /> }} />
      <Drawer.Screen name="Orders" component={AdminOrdersScreen} options={{ drawerIcon: ({ color }) => <ShoppingBag color={color} size={20} /> }} />
      <Drawer.Screen name="Customers" component={CustomersScreen} options={{ drawerIcon: ({ color }) => <UserPlus color={color} size={20} /> }} />
      <Drawer.Screen name="Technicians" component={TechniciansScreen} options={{ drawerIcon: ({ color }) => <Users color={color} size={20} /> }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} options={{ drawerIcon: ({ color }) => <Folder color={color} size={20} /> }} />
      <Drawer.Screen name="Products" component={AdminProductsScreen} options={{ drawerIcon: ({ color }) => <Package color={color} size={20} /> }} />
      <Drawer.Screen name="Tasks" component={AdminTasksScreen} options={{ drawerIcon: ({ color }) => <ClipboardList color={color} size={20} /> }} />
      <Drawer.Screen name="Tracking" component={TrackingScreen} options={{ drawerIcon: ({ color }) => <Map color={color} size={20} /> }} />
      
      <Drawer.Screen name="Expenses" component={AdminExpensesScreen} options={{ drawerIcon: ({ color }) => <Clock color={color} size={20} /> }} />
      <Drawer.Screen name="Attendance" component={AdminAttendanceScreen} options={{ drawerIcon: ({ color }) => <Activity color={color} size={20} /> }} />
      <Drawer.Screen name="Leaves" component={LeavesScreen} options={{ drawerIcon: ({ color }) => <Calendar color={color} size={20} /> }} />
      <Drawer.Screen name="Service Requests" component={ServiceRequestsScreen} options={{ drawerIcon: ({ color }) => <Hammer color={color} size={20} /> }} />
      <Drawer.Screen name="Availability" component={AvailabilityScreen} options={{ drawerIcon: ({ color }) => <UserCheck color={color} size={20} /> }} />
      <Drawer.Screen name="Billing" component={BillingScreen} options={{ drawerIcon: ({ color }) => <IndianRupee color={color} size={20} /> }} />
      <Drawer.Screen name="Salary" component={SalaryScreen} options={{ drawerIcon: ({ color }) => <CreditCard color={color} size={20} /> }} />
      <Drawer.Screen name="Marketing" component={MarketingScreen} options={{ drawerIcon: ({ color }) => <Layers color={color} size={20} /> }} />
      <Drawer.Screen name="Reviews" component={ReviewsScreen} options={{ drawerIcon: ({ color }) => <Star color={color} size={20} /> }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ drawerIcon: ({ color }) => <BarChart2 color={color} size={20} /> }} />
      <Drawer.Screen name="Logout" component={LogoutComponent} listeners={{ focus: () => { logout(); } }} options={{ drawerIcon: ({ color }) => <LogOut color={Colors.danger} size={20} />, drawerLabelStyle: { color: Colors.danger, fontSize: 14, fontWeight: '900' } }} />
    </Drawer.Navigator>
  );
}
