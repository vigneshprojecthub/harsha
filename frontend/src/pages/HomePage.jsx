import { motion } from 'framer-motion'
import HeroSection from '../components/landing/HeroSection'
import FeaturedProducts from '../components/landing/FeaturedProducts'
import AIPreviewBanner from '../components/landing/AIPreviewBanner'
import CategoriesSection from '../components/landing/CategoriesSection'
import WhyChooseUs from '../components/landing/WhyChooseUs'
import ReviewsSection from '../components/reviews/ReviewsSection'
import InstagramFeed from '../components/social/InstagramFeed'

export default function HomePage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="bg-charcoal-900 min-h-screen">
      {/* Compact hero — no full-screen scroll trap */}
      <HeroSection />
      {/* Horizontal scroll rows — Netflix style */}
      <div className="space-y-2 pb-24 md:pb-8">
        <CategoriesSection />
        <FeaturedProducts />
        <AIPreviewBanner />
        <WhyChooseUs />
        <ReviewsSection showForm={false} title="Customer Reviews" />
        <InstagramFeed limit={18} showHeader={false} />
      </div>
    </motion.div>
  )
}
