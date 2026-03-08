// LEXICAL
import type { EditorThemeClasses } from 'lexical';

export const blokhausTheme: EditorThemeClasses = {
  paragraph: 'blokhaus-paragraph',
  heading: {
    h1: 'blokhaus-h1',
    h2: 'blokhaus-h2',
    h3: 'blokhaus-h3',
    h4: 'blokhaus-h3',
    h5: 'blokhaus-h3',
    h6: 'blokhaus-h3',
  },
  quote: 'blokhaus-quote',
  list: {
    ul: 'blokhaus-ul',
    ol: 'blokhaus-ol',
    listitem: 'blokhaus-listitem',
    checklist: 'blokhaus-checklist',
    listitemChecked: 'blokhaus-listitem-checked',
    listitemUnchecked: 'blokhaus-listitem-unchecked',
    nested: {
      listitem: 'blokhaus-nested-listitem',
    },
  },
  text: {
    bold: 'blokhaus-bold',
    italic: 'blokhaus-italic',
    underline: 'blokhaus-underline',
    strikethrough: 'blokhaus-strikethrough',
    code: 'blokhaus-code',
  },
  link: 'blokhaus-link',
  code: 'blokhaus-code-block',
  table: 'blokhaus-table',
  tableRow: 'blokhaus-table-row',
  tableCell: 'blokhaus-table-cell',
  tableCellHeader: 'blokhaus-table-cell-header',
  tableSelection: 'blokhaus-table-selection',
  callout: 'blokhaus-callout',
  toggleContainer: 'blokhaus-toggle-container',
  toggleTitle: 'blokhaus-toggle-title',
  toggleContent: 'blokhaus-toggle-content',
};
