import { forwardRef } from "react";
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  BoldItalicUnderlineToggles,
  ListsToggle,
  DiffSourceToggleWrapper,
  Separator,
} from "@mdxeditor/editor";
import { useTheme } from "@/components/theme-provider";

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  function MarkdownEditor({ content, onContentChange }, ref) {
    const { theme } = useTheme();
    const isNasa = theme === "nasa";
    const isDark =
      isNasa ||
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const basePlugins = [
      headingsPlugin(),
      listsPlugin(),
      markdownShortcutPlugin(),
      diffSourcePlugin({ viewMode: "rich-text" }),
    ];

    const plugins = isNasa
      ? basePlugins
      : [
          ...basePlugins,
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
              </DiffSourceToggleWrapper>
            ),
          }),
        ];

    const editorClass = isNasa ? "dark-theme nasa-editor" : isDark ? "dark-theme dark-editor" : "";

    return (
      <MDXEditor
        ref={ref}
        markdown={content}
        onChange={onContentChange}
        className={editorClass}
        contentEditableClassName="prose dark:prose-invert"
        plugins={plugins}
      />
    );
  },
);
