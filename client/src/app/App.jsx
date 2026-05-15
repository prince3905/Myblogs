import { Navigate, Route, Routes } from 'react-router-dom';
import ToastProvider from '../components/Toast';
import AdminRoute from '../features/auth/components/AdminRoute';
import AdminLayout from '../features/admin/components/AdminLayout';
import AdminLoginPage from '../features/auth/pages/AdminLoginPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminCommentsPage from '../features/admin/pages/AdminCommentsPage';
import PostEditorPage from '../features/admin/pages/PostEditorPage';
import HomePage from '../features/blog/pages/HomePage';
import BlogListPage from '../features/blog/pages/BlogListPage';
import PostPage from '../features/blog/pages/PostPage';
import TagPage from '../features/blog/pages/TagPage';
import CategoryPage from '../features/blog/pages/CategoryPage';
import AboutPage from '../features/blog/pages/AboutPage';
import ContactPage from '../features/blog/pages/ContactPage';
import PrivacyPage from '../features/blog/pages/PrivacyPage';
import TermsPage from '../features/blog/pages/TermsPage';
import ArchivePage from '../features/blog/pages/ArchivePage';
import SearchPage from '../features/blog/pages/SearchPage';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<PostPage />} />
        <Route path="/tags/:tag" element={<TagPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="posts" element={<AdminDashboardPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:id/edit" element={<PostEditorPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
