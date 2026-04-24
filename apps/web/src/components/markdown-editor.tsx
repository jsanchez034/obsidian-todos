import { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { useTheme } from "@/components/theme-provider";

// tiptap-markdown v0.9 doesn't augment @tiptap/core's Storage interface itself,
// so editor.storage.markdown is untyped without this.
declare module "@tiptap/core" {
  interface Storage {
    markdown: MarkdownStorage;
  }
}

export interface MarkdownEditorMethods {
  setMarkdown: (markdown: string) => void;
}

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorMethods, MarkdownEditorProps>(
  function MarkdownEditor({ content, onContentChange }, ref) {
    const { theme } = useTheme();
    const isNasa = theme === "nasa";

    const editor = useEditor({
      extensions: [
        StarterKit,
        TaskList,
        TaskItem.configure({ nested: true }),
        Markdown.configure({ html: false, breaks: false, tightLists: true }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onContentChange(editor.storage.markdown.getMarkdown());
      },
      editorProps: {
        attributes: {
          class: "prose dark:prose-invert focus:outline-none max-w-none p-6",
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        setMarkdown: (md: string) => {
          editor?.commands.setContent(md);
        },
      }),
      [editor],
    );

    const editorClass = isNasa ? "nasa-editor" : "";

    return <EditorContent editor={editor} className={editorClass} />;
  },
);
