import "@dangao/date-util-es";
import { StackInfo, stackParsing, BashStyle } from "./utils";
import { writeLine } from "./utils/file";

const LogLevelColor = {
  error: BashStyle.Color.red,
  info: BashStyle.Color.primary,
  warn: BashStyle.Color.yellow,
  debug: BashStyle.Color.magenta,
};

export type LogLevel = keyof typeof LogLevelColor;

interface LogOutputConsole {
  /**
   * Display color
   * @default true
   */
  color?: boolean;
  /**
   * Display call details
   * @default true
   */
  callDetail?: boolean;
}

interface LogOutputFile {
  /**
   * Out Path
   * @default .
   */
  outpath?: string;
  /**
   * Out filename
   * @default {date(yyyy-mm-dd)}.{tag}.{level}.log
   */
  filename?: string;
}

interface LogOutputCustom {
  onPrint?(level: LogLevel, log: string, stackinf: StackInfo): void;
}

export interface LogOutputOption {
  /** Output to console */
  console?: boolean | LogOutputConsole;
  /** Output to file */
  file?: boolean | LogOutputFile;
  /** Output to custom channel */
  custom?: LogOutputCustom;
  /**
   * @default {
        error: true,
        debug: true,
        info: true,
        warn: true,
      }
   */
  levels?: Partial<Record<LogLevel, boolean>>;
  /**
   * @default {date(yyyy-mm-dd hh:min:ss.ms)} [{level}] [{tag}] {content} {stack(addr:row:col)}
   */
  printFormat?: string;
}

interface Option extends Required<LogOutputOption> {}

const defaultConsoleOption: Required<LogOutputConsole> = {
  color: true,
  callDetail: true,
};
const defaultFileOption: Required<LogOutputFile> = {
  outpath: ".",
  filename: "{date(yyyy-mm-dd)}.{tag}.{level}.log",
};
const defaultLevels: Partial<Record<LogLevel, boolean>> = {
  error: true,
  debug: true,
  info: true,
  warn: true,
};
const defaultPrintFormat = "{date(yyyy-mm-dd hh:min:ss.ms)} [{level}] [{tag}] {content} {stack(addr:row:col)}";

export class Log {
  private tags: string[] = [];

  private get tag() {
    return this.tags.join(" ");
  }

  public count = {
    info: 0,
    error: 0,
    warn: 0,
    debug: 0,
  };

  private option: Option = {
    console: defaultConsoleOption,
    file: defaultFileOption,
    custom: {},
    levels: defaultLevels,
    printFormat: defaultPrintFormat,
  };

  constructor(tags?: string | string[], originOptions: LogOutputOption = {}) {
    if (tags) {
      if (tags instanceof Array) {
        this.tags = tags;
      } else {
        this.tags.push(tags);
      }
    }
    this.mergeOption(originOptions);
  }

  private mergeOption(option: LogOutputOption) {
    if (option.console === false) {
      this.option.console = false;
    } else {
      Object.assign(this.option.console, option.console);
    }

    if (option.file === false) {
      this.option.file = false;
    } else {
      Object.assign(this.option.file, option.file);
    }

    Object.assign(this.option.custom, option.custom);

    Object.assign(this.option.levels, option.levels);

    if (option.printFormat) {
      this.option.printFormat = option.printFormat;
    }
  }

  private get consoleConf() {
    return this.option.console as Required<LogOutputConsole> | undefined;
  }

  private get fileConf() {
    return this.option.file as Required<LogOutputFile> | undefined;
  }

  public getDeriveLog(tag: string) {
    const newInstance = new Log([...this.tags], this.option);

    newInstance.tags.push(tag);

    return newInstance;
  }

  public info(...args: any[]) {
    this.output("info", ...args);
  }

  public error(...args: any[]) {
    this.output("error", ...args);
  }

  public warn(...args: any[]) {
    this.output("warn", ...args);
  }

  public debug(...args: any[]) {
    this.output("debug", ...args);
  }

  private output(level: LogLevel, ...args: any[]) {
    if (!this.option.levels[level]) {
      return;
    }

    /**
     * count ++
     */
    this.count[level]++;

    const { printFormat, custom } = this.option;
    const content = Log.formatArgs(...args).join(" ");
    const date = new Date();
    const stack = stackParsing()[3];

    const [styleMsg, noStyleMsg] = this.getFormatMsg(printFormat, content, date, stack, level);

    /** out to console */
    if (this.consoleConf) {
      console[level](styleMsg);
    }

    /** out to file */
    if (this.fileConf) {
      const { outpath, filename } = this.fileConf;
      const [_, formatOutputPath] = this.getFormatMsg(outpath, "", date, stack, level);
      const [_1, formatFilenamePath] = this.getFormatMsg(filename, "", date, stack, level);
      writeLine(formatOutputPath, formatFilenamePath, noStyleMsg);
    }

    /** out to custom */
    {
      if (custom.onPrint) {
        custom.onPrint(level, noStyleMsg, stack);
      }
    }
  }

  private getFormatMsg(format: string, content: string, date: Date, stack: StackInfo, level: LogLevel): [string, string] {
    const { tag } = this;
    let styleMsg = format;
    let noStyleMsg = format;

    /** date */
    const dateReg = /{date\(([^\)]*)\)}/gim;
    const dateExec = dateReg.exec(format);
    if (dateExec && dateExec.length > 1) {
      const dateStr = date.format(dateExec[1]);
      styleMsg = styleMsg.replace(dateReg, BashStyle.style(dateStr, [BashStyle.Color.cyan, BashStyle.Font.bold]));
      noStyleMsg = noStyleMsg.replace(dateReg, dateStr);
    }

    /** stack */
    const stackReg = /{stack\((.*)\)}/gim;
    const stackExec = stackReg.exec(format);
    if (stackExec && stackExec.length > 1) {
      if (stackExec && stackExec.length > 1) {
        let template = stackExec[1];
        template = template.replace(/addr/gim, stack.addr);
        template = template.replace(/row/gim, stack.row + "");
        template = template.replace(/col/gim, stack.col + "");
        template = template.replace(/trigger/gim, stack.trigger + "");

        template = "(" + BashStyle.style(template, [BashStyle.Color.blue, BashStyle.Font.underline]) + ")";

        styleMsg = styleMsg.replace(stackReg, template);
      }

      noStyleMsg = noStyleMsg.replace(stackReg, "");
    }

    /** level */
    const levelReg = /{level}/gim;
    styleMsg = styleMsg.replace(levelReg, BashStyle.style(level.toUpperCase(), [LogLevelColor[level]]));
    noStyleMsg = noStyleMsg.replace(levelReg, level.toUpperCase());

    /** tag */
    const tagReg = /{tag}/gim;
    styleMsg = styleMsg.replace(tagReg, BashStyle.style(tag, [BashStyle.Color.cyan]));
    noStyleMsg = noStyleMsg.replace(tagReg, tag);

    /** content */
    const contentReg = /{content}/gim;
    styleMsg = styleMsg.replace(contentReg, BashStyle.style(content, [BashStyle.Color.green]));
    noStyleMsg = noStyleMsg.replace(contentReg, content);

    return [styleMsg, noStyleMsg];
  }

  private static formatArgs(...args: any[]) {
    return args.map((arg) => {
      if (arg instanceof Error) {
        return arg.message;
      }
      if (arg instanceof Object) {
        return JSON.stringify(arg);
      }

      return arg + "";
    });
  }
}
