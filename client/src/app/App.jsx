import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ToastProvider from '../components/Toast';
import AdminRoute from '../features/auth/components/AdminRoute';

// Static import for the primary entry page (HomePage) to prevent network waterfalls on initial load:
import HomePage from '../features/blog/pages/HomePage';

// Lazy load secondary/heavy public pages
const BlogListPage = lazy(() => import('../features/blog/pages/BlogListPage'));
const PostPage = lazy(() => import('../features/blog/pages/PostPage'));
const BlogRedirectPage = lazy(() => import('../features/blog/pages/BlogRedirectPage'));
const TagPage = lazy(() => import('../features/blog/pages/TagPage'));
const CategoryPage = lazy(() => import('../features/blog/pages/CategoryPage'));
const AboutPage = lazy(() => import('../features/blog/pages/AboutPage'));
const ContactPage = lazy(() => import('../features/blog/pages/ContactPage'));
const PrivacyPage = lazy(() => import('../features/blog/pages/PrivacyPage'));
const TermsPage = lazy(() => import('../features/blog/pages/TermsPage'));
const ArchivePage = lazy(() => import('../features/blog/pages/ArchivePage'));
const SearchPage = lazy(() => import('../features/blog/pages/SearchPage'));
const ToolsPage = lazy(() => import('../features/tools/pages/ToolsPage'));
const GamesPage = lazy(() => import('../features/games/pages/GamesPage'));
const PublicLiveAlertsPage = lazy(() => import('../features/blog/pages/PublicLiveAlertsPage'));

// Lazy load admin features
const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout'));
const AdminLoginPage = lazy(() => import('../features/auth/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const AdminCommentsPage = lazy(() => import('../features/admin/pages/AdminCommentsPage'));
const AdminAdsPage = lazy(() => import('../features/admin/pages/AdminAdsPage'));
const KeywordResearchPage = lazy(() => import('../features/admin/pages/KeywordResearchPage'));
const PostEditorPage = lazy(() => import('../features/admin/pages/PostEditorPage'));
const LiveAlertsPage = lazy(() => import('../features/admin/pages/LiveAlertsPage'));
const AdminSettingsPage = lazy(() => import('../features/admin/pages/AdminSettingsPage'));

const AdminLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#666' }}>
    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginRight: '12px' }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    Loading Admin Panel...
  </div>
);

const PublicLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #4F46E5', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const withAdminSuspense = (Component) => (props) => (
  <Suspense fallback={<AdminLoading />}>
    <Component {...props} />
  </Suspense>
);

const withPublicSuspense = (Component) => (props) => (
  <Suspense fallback={<PublicLoading />}>
    <Component {...props} />
  </Suspense>
);

const AdminLayoutSuspense = withAdminSuspense(AdminLayout);
const AdminLoginPageSuspense = withAdminSuspense(AdminLoginPage);
const AdminDashboardPageSuspense = withAdminSuspense(AdminDashboardPage);
const AdminCommentsPageSuspense = withAdminSuspense(AdminCommentsPage);
const AdminAdsPageSuspense = withAdminSuspense(AdminAdsPage);
const KeywordResearchPageSuspense = withAdminSuspense(KeywordResearchPage);
const PostEditorPageSuspense = withAdminSuspense(PostEditorPage);
const LiveAlertsPageSuspense = withAdminSuspense(LiveAlertsPage);
const AdminSettingsPageSuspense = withAdminSuspense(AdminSettingsPage);

const BlogListPageSuspense = withPublicSuspense(BlogListPage);
const PostPageSuspense = withPublicSuspense(PostPage);
const BlogRedirectPageSuspense = withPublicSuspense(BlogRedirectPage);
const TagPageSuspense = withPublicSuspense(TagPage);
const CategoryPageSuspense = withPublicSuspense(CategoryPage);
const AboutPageSuspense = withPublicSuspense(AboutPage);
const ContactPageSuspense = withPublicSuspense(ContactPage);
const PrivacyPageSuspense = withPublicSuspense(PrivacyPage);
const TermsPageSuspense = withPublicSuspense(TermsPage);
const ArchivePageSuspense = withPublicSuspense(ArchivePage);
const SearchPageSuspense = withPublicSuspense(SearchPage);
const ToolsPageSuspense = withPublicSuspense(ToolsPage);
const GamesPageSuspense = withPublicSuspense(GamesPage);
const PublicLiveAlertsPageSuspense = withPublicSuspense(PublicLiveAlertsPage);

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogListPageSuspense />} />
        <Route path="/blog/:category/:slug" element={<PostPageSuspense />} />
        <Route path="/blog/:slug" element={<BlogRedirectPageSuspense />} />
        <Route path="/tags/:tag" element={<TagPageSuspense />} />
        <Route path="/category/:category" element={<CategoryPageSuspense />} />
        <Route path="/about" element={<AboutPageSuspense />} />
        <Route path="/contact" element={<ContactPageSuspense />} />
        <Route path="/privacy" element={<PrivacyPageSuspense />} />
        <Route path="/terms" element={<TermsPageSuspense />} />
        <Route path="/archive" element={<ArchivePageSuspense />} />
        <Route path="/search" element={<SearchPageSuspense />} />
        <Route path="/tools" element={<ToolsPageSuspense />} />
        <Route path="/games" element={<GamesPageSuspense />} />
        <Route path="/job-alerts" element={<PublicLiveAlertsPageSuspense />} />
        <Route path="/admin/login" element={<AdminLoginPageSuspense />} />
        <Route path="/admin" element={<AdminRoute><AdminLayoutSuspense /></AdminRoute>}>
          <Route index element={<AdminDashboardPageSuspense />} />
          <Route path="posts" element={<AdminDashboardPageSuspense />} />
          <Route path="comments" element={<AdminCommentsPageSuspense />} />
          <Route path="ads" element={<AdminAdsPageSuspense />} />
          <Route path="keywords" element={<KeywordResearchPageSuspense />} />
          <Route path="live-alerts" element={<LiveAlertsPageSuspense />} />
          <Route path="posts/new" element={<PostEditorPageSuspense />} />
          <Route path="posts/:id/edit" element={<PostEditorPageSuspense />} />
          <Route path="settings" element={<AdminSettingsPageSuspense />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
