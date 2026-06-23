import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { CartProvider } from './context/CartContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CustomOrderPage from './pages/CustomOrderPage'
import AIPreviewPage from './pages/AIPreviewPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import PaymentPage from './pages/checkout/PaymentPage'
import OrderConfirmationPage from './pages/orders/OrderConfirmationPage'
import OrderTrackingPage from './pages/tracking/OrderTrackingPage'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import AdminTracking from './pages/admin/AdminTracking'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminCouponsReviews from './pages/admin/AdminCouponsReviews'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="custom-order" element={<CustomOrderPage />} />
              <Route path="ai-preview" element={<AIPreviewPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="checkout/payment" element={<PaymentPage />} />
              <Route path="order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="track" element={<OrderTrackingPage />} />
              <Route path="track/:token" element={<OrderTrackingPage />} />
              <Route path="my-orders" element={<CustomerDashboard />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="tracking" element={<AdminTracking />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="coupons-reviews" element={<AdminCouponsReviews />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </CartProvider>
  )
}
