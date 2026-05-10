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
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:id/edit" element={<PostEditorPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
