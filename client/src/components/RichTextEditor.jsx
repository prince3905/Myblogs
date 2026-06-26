import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Register custom block embed for tables to prevent Quill from stripping them
const BlockEmbed = Quill.import('blots/block/embed');

class TableEmbed extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.innerHTML = value;
    return node;
  }

  static value(node) {
    return node.innerHTML;
  }
}
TableEmbed.blotName = 'table-embed';
TableEmbed.tagName = 'div';
TableEmbed.className = 'ql-table-embed';

Quill.register(TableEmbed);

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

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image',
    'table-embed'
  ];

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder="Write your blog post content here..."
    />
  );
}
