import { Navigate, Route, Routes } from 'react-router-dom';
import ToastProvider from '../components/Toast';
import AdminRoute from '../features/auth/components/AdminRoute';
import AdminLoginPage from '../features/auth/pages/AdminLoginPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import PostEditorPage from '../features/admin/pages/PostEditorPage';
import HomePage from '../features/blog/pages/HomePage';
import BlogListPage from '../features/blog/pages/BlogListPage';
import PostPage from '../features/blog/pages/PostPage';
import ArchivePage from '../features/blog/pages/ArchivePage';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<PostPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/posts/new" element={<AdminRoute><PostEditorPage /></AdminRoute>} />
        <Route path="/admin/posts/:id/edit" element={<AdminRoute><PostEditorPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
