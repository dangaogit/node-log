import { appendFile, mkdir } from "fs";
import path from "path";

export function writeLine(dirpath: string, filename: string, str: string) {
  const filepath = path.join(dirpath, filename);
  str = "\n" + str;
  try {
    appendFile(filepath, str, (err) => {
      if (err) {
        console.error(err);
        if (/no\ssuch\sfile\sor\sdirectory/gi.test(err.message)) {
          mkdir(dirpath, (err) => {
            if (err) {
              return console.error(err);
            }
            appendFile(filepath, str, () => {});
          });
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
}
