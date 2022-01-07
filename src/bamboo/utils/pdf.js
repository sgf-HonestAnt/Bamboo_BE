import PdfPrinter from "pdfmake";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pipeline } from "stream";
import fs from "fs-extra";
import { promisify } from "util";

const { createWriteStream } = fs;

const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

export const generateEditsPDFAsync = async (data) => {
  const asyncPipeline = promisify(pipeline);
  const docDefinition = {
    content: [
      `New profile details:`,
      `First name: ${data.first_name}`,
      `Last name: ${data.last_name}`,
      `Email: ${data.email}`,
      `Username: ${data.username}`,
      `Avatar: ${data.avatar}`,
      `Password Changed: ${data.password}`,
    ],
  };
  const options = {};
  const pdfReadableStream = printer.createPdfKitDocument(
    docDefinition,
    options
  );
  pdfReadableStream.end();
  const path = join(dirname(fileURLToPath(import.meta.url)), "profile.pdf");
  await asyncPipeline(pdfReadableStream, fs.createWriteStream(path)); // generatePDFAsync will await for the stream to end before returning
  return path;
};
