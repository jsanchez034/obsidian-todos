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
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
      <MDXEditor
        ref={ref}
        markdown={content}
        onChange={onContentChange}
        className={isDark ? "dark-theme dark-editor" : ""}
        contentEditableClassName="prose dark:prose-invert"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: "rich-text" }),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
      />
    );
  },
);
