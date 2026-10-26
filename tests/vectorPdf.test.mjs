import test from "node:test";
import assert from "node:assert/strict";
import { encodePdfText, svgToPdf } from "../src/recordings/vectorPdf.js";

function element(name, attributes = {}, childElements = [], text = "") {
  const node = {
    localName: name,
    children: childElements,
    textContent: text,
    getAttribute(key) {
      return Object.hasOwn(attributes, key) ? String(attributes[key]) : null;
    },
    querySelectorAll() {
      return this.children
        .flatMap((child) => [child, ...child.querySelectorAll()])
        .filter((child) => child.getAttribute("id") !== null);
    },
  };
  return node;
}

function fixture() {
  return element(
    "svg",
    {
      width: 1600,
      height: 1200,
      viewBox: "0 0 1600 1200",
      preserveAspectRatio: "xMidYMid meet",
      "font-size": 20,
    },
    [
      element("defs", {}, [
        element("clipPath", { id: "plot-clip" }, [
          element("rect", { x: 0, y: 0, width: 100, height: 80 }),
        ]),
        element("linearGradient", { id: "scale", x1: 0, y1: 1, x2: 0, y2: 0 }, [
          element("stop", { offset: "0%", "stop-color": "#0000ff" }),
          element("stop", { offset: "100%", "stop-color": "#ff0000" }),
        ]),
      ]),
      element("rect", { width: 1600, height: 1200, fill: "#071118" }),
      element(
        "text",
        {
          x: 42,
          y: 46,
          fill: "#ffffff",
          "font-weight": 700,
          "dominant-baseline": "middle",
        },
        [],
        "CONOX · µV² · données provisoires",
      ),
      element(
        "svg",
        { x: 57, y: 329, width: 1486, height: 201, viewBox: "0 0 1486 201" },
        [
          element("g", { "clip-path": "url(#plot-clip)" }, [
            element("path", {
              d: "M0,10 L10,20 M30,20 L40,10",
              fill: "none",
              stroke: "#edfff6",
              "stroke-width": 1.25,
            }),
          ]),
        ],
      ),
      element("rect", {
        x: 1444,
        y: 635,
        width: 31,
        height: 205,
        fill: "url(#scale)",
        stroke: "#6a7a84",
      }),
    ],
  );
}

function checkOffsets(bytes) {
  const text = bytes.toString("latin1");
  const xref = Number(/startxref\n(\d+)/.exec(text)[1]);
  assert.equal(text.slice(xref, xref + 4), "xref");
  const lines = text.slice(xref).split("\n");
  const count = Number(lines[1].split(" ")[1]);
  for (let id = 1; id < count; id++) {
    const offset = Number(lines[id + 2].slice(0, 10));
    assert.equal(
      text.slice(offset, offset + `${id} 0 obj`.length),
      `${id} 0 obj`,
    );
  }
  const contentObject = text.slice(text.indexOf("6 0 obj"));
  const length = Number(/\/Length (\d+)/.exec(contentObject)[1]);
  const body = contentObject.slice(
    contentObject.indexOf("stream\n") + 7,
    contentObject.indexOf("endstream"),
  );
  assert.equal(Buffer.byteLength(body, "latin1"), length);
  return text;
}

test("PDF text encoding preserves French, German and scientific characters safely", () => {
  assert.equal(
    encodePdfText("µV² éä’ (CONOX) \\"),
    "(\\265V\\262 \\351\\344\\222 \\(CONOX\\) \\\\)",
  );
  assert.equal(encodePdfText("0 → 10"), "(0 -> 10)");
});

test("block SVG exports actual PDF text and paths with byte-correct object offsets", async () => {
  const pdf = await svgToPdf(fixture());
  assert.equal(pdf.type, "application/pdf");
  const text = checkOffsets(Buffer.from(await pdf.arrayBuffer()));
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/BaseFont \/Helvetica-Bold/);
  assert.match(text, /\/Encoding \/WinAnsiEncoding/);
  assert.match(text, /CONOX \\267 \\265V\\262/);
  assert.match(text, / Tj\nET/);
  assert.match(text, /1 0 0 1 57 329 cm/);
  assert.match(text, /0 10 m\n10 20 l\n30 20 m\n40 10 l/);
  assert.match(text, /100 80 re\nW n/);
  assert.doesNotMatch(text, /\/Subtype \/Image|\/DCTDecode/);
  assert.doesNotMatch(text, /NaN|Infinity/);
});

test("only the DSA image becomes a JPEG XObject, never the whole overview", async () => {
  const root = fixture();
  root.children.push(
    element("image", {
      x: 57,
      y: 613,
      width: 1372,
      height: 257,
      href: "data:image/png;base64,AA==",
    }),
  );
  const jpeg = new Uint8Array([255, 216, 17, 33, 255, 217]);
  class Image {
    naturalWidth = 2;
    naturalHeight = 3;
    async decode() {}
  }
  const document = {
    defaultView: { Image },
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          fillRect() {},
          drawImage() {},
          measureText: () => ({ width: 200 }),
        }),
        toBlob(callback, type) {
          callback(new Blob([jpeg], { type }));
        },
      };
    },
  };
  const assignDocument = (node) => {
    node.ownerDocument = document;
    node.children.forEach(assignDocument);
  };
  assignDocument(root);
  const bytes = Buffer.from(await (await svgToPdf(root)).arrayBuffer());
  const text = checkOffsets(bytes);
  assert.equal((text.match(/\/Subtype \/Image/g) || []).length, 1);
  assert.match(text, /\/Width 2 \/Height 3/);
  assert.doesNotMatch(text, /\/Width 1600 \/Height 1200/);
  assert.match(text, /1372 0 0 -257 57 870 cm\n\/Im0 Do/);
  const start = text.indexOf("stream\n", text.indexOf("/Subtype /Image")) + 7;
  assert.deepEqual(
    bytes.subarray(start, start + jpeg.length),
    Buffer.from(jpeg),
  );
  assert.match(text, /CONOX .* Tj/);
});

test("unsupported SVG content rejects instead of silently dropping parts", async () => {
  for (const unsupported of [
    element("foreignObject"),
    element("path", { d: "M0,0 C1,2 3,4 5,6" }),
    element("image", { href: "https://example.invalid/image.png" }),
  ]) {
    const root = fixture();
    root.children.push(unsupported);
    await assert.rejects(
      svgToPdf(root),
      (error) => error.code === "EXPORT_FAILED",
    );
  }
});
