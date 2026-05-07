import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange }) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      placeholder="Write your blog post content here..."
    />
  );
}
