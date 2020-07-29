import "@dangao/date-util-es";
import { StackInfo, stackParsing, BashStyle } from "./utils";

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
  onPrintInfo?(log: string, stackinf: StackInfo): void;
  onPrintError?(log: string, stackinf: StackInfo): void;
  onPrintWarn?(log: string, stackinf: StackInfo): void;
  onPrintDebug?(log: string, stackinf: StackInfo): void;
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
   * @default {date(yyyy-mm-dd hh:min:ss.ms)} [{level}] [{tag}] {content} ({stack(addr:row:col)})
   */
  printFormat?: string;
}

interface Option extends Required<LogOutputOption> {}

const defaultConsoleOption: LogOutputConsole = {
  color: true,
  callDetail: true,
};
const defaultFileOption: LogOutputFile = {
  outpath: ".",
  filename: "{date(yyyy-mm-dd)}.{tag}.{level}.log",
};
const defaultLevels: Partial<Record<LogLevel, boolean>> = {
  error: true,
  debug: true,
  info: true,
  warn: true,
};
const defaultPrintFormat = "{date(yyyy-mm-dd hh:min:ss.ms)} [{level}] [{tag}] {content} ({stack(addr:row:col)})";

export class Log {
  private tag = "";

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

  constructor(originOptions: LogOutputOption = {}) {
    this.mergeOption(originOptions);
  }

  private mergeOption(option: LogOutputOption) {
    Object.assign(this.option, option);
  }

  private get consoleConf() {
    const { console } = this.option;
    if (console) {
      return typeof console === "boolean" ? defaultConsoleOption : console;
    }
  }

  private get fileConf() {
    const { file } = this.option;

    if (file) {
      return typeof file === "boolean" ? defaultFileOption : file;
    }
  }

  public getDeriveLog(tag: string) {
    const newInstance = new Log(this.option);

    newInstance.tag = tag;

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

    const { printFormat } = this.option;
    const content = Log.formatArgs(args).join(" ");

    /** assembly msg */
    let msg = printFormat;

    msg = this.fillDate(msg);
    msg = this.fillStack(msg);
    msg = this.fillTag(msg);
    msg = this.fillLevel(msg, level);
    msg = this.fillContent(msg, content);

    const noStyleMsg = msg.replace(/\033\[[^m]+m/gim, "");
    
    if(this.consoleConf) {
      console[level](msg);
    }
  }

  private fillLevel(msg: string, level: LogLevel) {
    return msg.replace(/level/gim, BashStyle.style(level.toUpperCase(), [LogLevelColor[level]]));
  }

  private fillTag(msg: string) {
    const { tag } = this;
    return msg.replace(/tag/gim, BashStyle.style(tag, [BashStyle.Color.cyan]));
  }

  private fillContent(msg: string, content: string) {
    return msg.replace(/content/gim, BashStyle.style(content, [BashStyle.Color.green]));
  }

  private fillStack(msg: string) {
    const { callDetail } = this.consoleConf || {};
    if (!callDetail) {
      return msg;
    }

    const stackinf = stackParsing()[4];
    const reg = /{stack\((.*)\)}/gim;
    const match = msg.match(reg);
    if (match && match.length > 1) {
      let template = match[1];
      template = template.replace(/addr/gim, stackinf.addr);
      template = template.replace(/row/gim, stackinf.row + "");
      template = template.replace(/col/gim, stackinf.col + "");
      template = template.replace(/trigger/gim, stackinf.trigger + "");

      template = BashStyle.style(msg, [BashStyle.Color.blue, BashStyle.Font.underline]);

      return msg.replace(reg, template);
    }

    return msg;
  }

  private fillDate(msg: string) {
    const { color } = this.consoleConf || {};
    const reg = /{date\(([^\)]*)\)}/gim;
    const match = msg.match(reg);
    if (match && match.length > 1) {
      let str = new Date().format(match[1]);

      if (color) {
        msg = BashStyle.style(msg, [BashStyle.Color.cyan, BashStyle.Font.bold]);
      }

      msg = msg.replace(reg, str);
    }

    return msg;
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
