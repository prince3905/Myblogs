import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Quill = ReactQuill.Quill;

if (Quill) {
  const BlockEmbed = Quill.import('blots/block/embed');

  class TableEmbedBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      node.setAttribute('contenteditable', 'false');
      node.style.margin = '16px 0';
      node.style.display = 'block';
      node.innerHTML = value;
      return node;
    }

    static value(node) {
      return node.innerHTML;
    }
  }
  TableEmbedBlot.blotName = 'table-embed';
  TableEmbedBlot.tagName = 'div';
  TableEmbedBlot.className = 'quill-table-embed';
  Quill.register(TableEmbedBlot);
}

export default function RichTextEditor({ value, onChange }) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchers: [
        ['table', (node) => {
          const Delta = Quill.import('delta');
          return new Delta().insert({ 'table-embed': node.outerHTML });
        }]
      ]
    }
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
