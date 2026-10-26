import "server-only";
import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { marked, type Token, type Tokens } from "marked";
import type { ReactNode } from "react";

const fontFile = (name: string) => path.join(process.cwd(), "node_modules/@fontsource/inter/files", `inter-latin-${name}.woff`);
Font.register({
  family: "Inter",
  fonts: [
    { src: fontFile("400-normal"), fontWeight: 400 },
    { src: fontFile("400-italic"), fontWeight: 400, fontStyle: "italic" },
    { src: fontFile("600-normal"), fontWeight: 600 },
    { src: fontFile("700-normal"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const INK = "#111827";
const MUTED = "#4B5563";
const LINE = "#E5E7EB";

const s = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 64, paddingHorizontal: 56, fontFamily: "Inter", fontSize: 10, color: INK, lineHeight: 1.5 },
  h1: { fontSize: 21, fontWeight: 700, marginBottom: 14, lineHeight: 1.25, letterSpacing: -0.3 },
  h2: { fontSize: 13, fontWeight: 600, marginTop: 18, marginBottom: 6 },
  h3: { fontSize: 11, fontWeight: 600, marginTop: 12, marginBottom: 4 },
  p: { marginBottom: 8 },
  li: { flexDirection: "row", marginBottom: 4 },
  bullet: { width: 16, color: MUTED },
  liText: { flex: 1 },
  table: { borderTopWidth: 1, borderColor: LINE, marginVertical: 8 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE },
  th: { flex: 1, paddingVertical: 6, paddingRight: 8, fontWeight: 600, color: MUTED, fontSize: 9 },
  td: { flex: 1, paddingVertical: 6, paddingRight: 8 },
  hr: { borderBottomWidth: 1, borderColor: LINE, marginVertical: 12 },
  quote: { borderLeftWidth: 1, borderColor: LINE, paddingLeft: 10, color: MUTED, marginBottom: 8 },
  footer: { position: "absolute", bottom: 30, left: 56, right: 56, fontSize: 8, color: MUTED },
});

function inline(tokens: Token[] | undefined, key = "i"): ReactNode[] {
  if (!tokens) return [];
  return tokens.map((t, i) => {
    const k = `${key}-${i}`;
    switch (t.type) {
      case "strong":
        return <Text key={k} style={{ fontWeight: 600 }}>{inline((t as Tokens.Strong).tokens, k)}</Text>;
      case "em":
        return <Text key={k} style={{ fontStyle: "italic" }}>{inline((t as Tokens.Em).tokens, k)}</Text>;
      case "codespan":
        return <Text key={k} style={{ fontFamily: "Courier" }}>{(t as Tokens.Codespan).text}</Text>;
      case "link":
        return <Text key={k}>{inline((t as Tokens.Link).tokens, k)}</Text>;
      case "br":
        return <Text key={k}>{"\n"}</Text>;
      case "text": {
        const tt = t as Tokens.Text;
        return tt.tokens ? <Text key={k}>{inline(tt.tokens, k)}</Text> : <Text key={k}>{decode(tt.text)}</Text>;
      }
      default:
        return <Text key={k}>{"text" in t ? decode(String(t.text)) : ""}</Text>;
    }
  });
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function block(t: Token, i: number): ReactNode {
  switch (t.type) {
    case "heading": {
      const h = t as Tokens.Heading;
      const style = h.depth === 1 ? s.h1 : h.depth === 2 ? s.h2 : s.h3;
      return <Text key={i} style={style} minPresenceAhead={40}>{inline(h.tokens, `h${i}`)}</Text>;
    }
    case "paragraph":
      return <Text key={i} style={s.p}>{inline((t as Tokens.Paragraph).tokens, `p${i}`)}</Text>;
    case "list": {
      const l = t as Tokens.List;
      return (
        <View key={i} style={{ marginBottom: 8 }}>
          {l.items.map((item, j) => (
            <View key={j} style={s.li} wrap={false}>
              <Text style={s.bullet}>{l.ordered ? `${Number(l.start || 1) + j}.` : "•"}</Text>
              <Text style={s.liText}>
                {item.tokens.flatMap((it, n) =>
                  it.type === "text" || it.type === "paragraph"
                    ? inline((it as Tokens.Text).tokens ?? [it], `li${i}-${j}-${n}`)
                    : [],
                )}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    case "table": {
      const tb = t as Tokens.Table;
      return (
        <View key={i} style={s.table} wrap={false}>
          <View style={s.tr}>
            {tb.header.map((c, j) => (
              <Text key={j} style={s.th}>{inline(c.tokens, `th${i}-${j}`)}</Text>
            ))}
          </View>
          {tb.rows.map((row, r) => (
            <View key={r} style={s.tr}>
              {row.map((c, j) => (
                <Text key={j} style={s.td}>{inline(c.tokens, `td${i}-${r}-${j}`)}</Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case "blockquote":
      return <View key={i} style={s.quote}>{(t as Tokens.Blockquote).tokens.map(block)}</View>;
    case "hr":
      return <View key={i} style={s.hr} />;
    case "code":
      return <Text key={i} style={{ fontFamily: "Courier", marginBottom: 8 }}>{(t as Tokens.Code).text}</Text>;
    default:
      return null;
  }
}

export async function renderOfferPdf(markdown: string, meta: { title: string; company: string }): Promise<Uint8Array> {
  const tokens = marked.lexer(markdown);
  const doc = (
    <Document title={meta.title} author="Offer Desk" subject={`Offer for ${meta.company}`}>
      <Page size="A4" style={s.page}>
        {tokens.map(block)}
        <Text style={s.footer} fixed>
          {meta.company}
        </Text>
      </Page>
    </Document>
  );
  return new Uint8Array(await renderToBuffer(doc));
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false, gfm: true }) as string;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "offer";
}
