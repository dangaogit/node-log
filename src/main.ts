import "@dangao/date-util-es"
import { appendFile, mkdir } from "fs";


export type LogLevel = "error" | "info" | "warn";

export interface LogOption {
  outpath?: string;
  filename?: string;
  console?: boolean;
}

export class Log {
  constructor(private tag: string = "Log", private option?: LogOption) {}

  private format(level: LogLevel, ...content: string[]) {
    const msg = `${new Date().format("yyyy-mm-dd hh:min:ss.ms")} ${this.tag} ${level.toUpperCase()} ${content.join(" ")}`;
    const { outpath, filename, console: isConsole } = this.option || {
      console: true
    };

    if (isConsole) {
      console[level](msg);
    }

    if (outpath) {
      writeLine(outpath, `/${filename || "out"}_${level}.log`, msg + "\r\n");
    }
  }
  public error = (...e: any[]) => {
    this.format("error", ...e);
  };
  public info = (...msg: any[]) => {
    this.format("info", ...msg);
  };
  public warn = (...msg: any[]) => {
    this.format("warn", ...msg);
  };
}
function writeLine(dirpath: string, filename: string, str: string) {
  const filepath = path.join(dirpath, filename);
  try {
    appendFile(filepath, str, err => {
      if (err) {
        new Log("Log-append").error(err);
        if (/no\ssuch\sfile\sor\sdirectory/gi.test(err.message)) {
          mkdir(dirpath, err => {
            if (err) {
              return new Log("Log-create").error(err);
            }
            appendFile(filepath, str, () => {});
          });
        }
      }
    });
  } catch (e) {
    new Log("Log").error(e);
  }
}
