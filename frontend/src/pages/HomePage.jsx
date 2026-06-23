import { motion } from 'framer-motion'
import HeroSection from '../components/landing/HeroSection'
import FeaturedProducts from '../components/landing/FeaturedProducts'
import AIPreviewBanner from '../components/landing/AIPreviewBanner'
import CategoriesSection from '../components/landing/CategoriesSection'
import WhyChooseUs from '../components/landing/WhyChooseUs'
import CTABanner from '../components/landing/CTABanner'
import ReviewsSection from '../components/reviews/ReviewsSection'
import InstagramFeed from '../components/social/InstagramFeed'
import FAQSection from '../components/landing/FAQSection'

export default function HomePage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <HeroSection />
      <FeaturedProducts />
      <AIPreviewBanner />
      <CategoriesSection />
      <WhyChooseUs />
      <CTABanner />
      <ReviewsSection showForm={true} title="What Our Customers Say" />
      <InstagramFeed limit={9} showHeader={true} />
      <FAQSection />
    </motion.div>
  )
}
