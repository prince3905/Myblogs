import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ToastProvider from '../components/Toast';
import AdminRoute from '../features/auth/components/AdminRoute';

// Lazy load admin features
const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout'));
const AdminLoginPage = lazy(() => import('../features/auth/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const AdminCommentsPage = lazy(() => import('../features/admin/pages/AdminCommentsPage'));
const AdminAdsPage = lazy(() => import('../features/admin/pages/AdminAdsPage'));
const KeywordResearchPage = lazy(() => import('../features/admin/pages/KeywordResearchPage'));
const PostEditorPage = lazy(() => import('../features/admin/pages/PostEditorPage'));

import HomePage from '../features/blog/pages/HomePage';
import BlogListPage from '../features/blog/pages/BlogListPage';
import PostPage from '../features/blog/pages/PostPage';
import BlogRedirectPage from '../features/blog/pages/BlogRedirectPage';
import TagPage from '../features/blog/pages/TagPage';
import CategoryPage from '../features/blog/pages/CategoryPage';
import AboutPage from '../features/blog/pages/AboutPage';
import ContactPage from '../features/blog/pages/ContactPage';
import PrivacyPage from '../features/blog/pages/PrivacyPage';
import TermsPage from '../features/blog/pages/TermsPage';
import ArchivePage from '../features/blog/pages/ArchivePage';
import SearchPage from '../features/blog/pages/SearchPage';
import ToolsPage from '../features/tools/pages/ToolsPage';
import GamesPage from '../features/games/pages/GamesPage';

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

const withAdminSuspense = (Component) => (props) => (
  <Suspense fallback={<AdminLoading />}>
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

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:category/:slug" element={<PostPage />} />
        <Route path="/blog/:slug" element={<BlogRedirectPage />} />
        <Route path="/tags/:tag" element={<TagPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/admin/login" element={<AdminLoginPageSuspense />} />
        <Route path="/admin" element={<AdminRoute><AdminLayoutSuspense /></AdminRoute>}>
          <Route index element={<AdminDashboardPageSuspense />} />
          <Route path="posts" element={<AdminDashboardPageSuspense />} />
          <Route path="comments" element={<AdminCommentsPageSuspense />} />
          <Route path="ads" element={<AdminAdsPageSuspense />} />
          <Route path="keywords" element={<KeywordResearchPageSuspense />} />
          <Route path="posts/new" element={<PostEditorPageSuspense />} />
          <Route path="posts/:id/edit" element={<PostEditorPageSuspense />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
